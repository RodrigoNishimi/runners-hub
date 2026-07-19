"""Dispatcher de notificações do RunnersHub (e-mail via Resend).

Consome o feed de mudanças do ETL (contrato público da CLI):

    python -m corridas_etl.pipeline.notify --json        # lê o feed
    python -m corridas_etl.pipeline.notify --mark-sent    # marca despachado

e envia um e-mail para cada usuário que salvou o evento afetado, com dedupe
por (usuário, mudança) em app.notification_log — o notified_at do ETL é
global ("entrou no feed"), não por destinatário.

Uso (agendar via schtasks DEPOIS do job diário do ETL):

    python notifier/dispatch.py             # envia pendentes
    python notifier/dispatch.py --dry-run    # mostra o que enviaria, sem enviar

Config via variáveis de ambiente (ou .env na raiz do RunnersHub):
    DATABASE_URL      Postgres compartilhado (schemas public + app)
    RESEND_API_KEY    chave da API do Resend
    EMAIL_FROM        remetente (ex: "RunnersHub <avisos@dominio>")
    SITE_URL          base dos links (ex: https://runnershub.vercel.app)
    ETL_DIR           raiz do repo do ETL (default: ../ETL_pipeline_running_events)
    ETL_PYTHON        python do venv do ETL (default: ETL_DIR/.venv/Scripts/python.exe)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import psycopg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("runnershub.notifier")

ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Carrega .env simples (KEY=VALUE) sem depender de python-dotenv."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def _etl_python() -> tuple[Path, Path]:
    etl_dir = Path(os.environ.get("ETL_DIR", ROOT.parent / "ETL_pipeline_running_events"))
    default_py = etl_dir / ".venv" / "Scripts" / "python.exe"
    python = Path(os.environ.get("ETL_PYTHON", default_py))
    return etl_dir, python


def run_notify_cli(*extra_args: str) -> str:
    """Roda `python -m corridas_etl.pipeline.notify` no venv do ETL."""
    etl_dir, python = _etl_python()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(etl_dir / "src")
    proc = subprocess.run(
        [str(python), "-m", "corridas_etl.pipeline.notify", *extra_args],
        cwd=etl_dir,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        raise RuntimeError(f"notify CLI falhou: {proc.stderr.strip()[:500]}")
    return proc.stdout


def fetch_feed() -> list[dict]:
    return json.loads(run_notify_cli("--json"))


def recipients_for(conn: psycopg.Connection, event_id: int) -> list[tuple[str, str]]:
    """(user_id, email) de quem salvou o evento, qualquer status."""
    rows = conn.execute(
        """
        SELECT s.user_id, u.email
        FROM app.saved_event s
        JOIN app."user" u ON u.id = s.user_id
        WHERE s.event_id = %s AND u.email IS NOT NULL
        """,
        (event_id,),
    ).fetchall()
    return [(r[0], r[1]) for r in rows]


def already_sent(conn: psycopg.Connection, user_id: str, change_id: int) -> bool:
    row = conn.execute(
        "SELECT 1 FROM app.notification_log WHERE user_id = %s AND event_change_id = %s",
        (user_id, change_id),
    ).fetchone()
    return row is not None


def log_sent(conn: psycopg.Connection, user_id: str, change_id: int) -> None:
    conn.execute(
        """
        INSERT INTO app.notification_log (user_id, event_change_id)
        VALUES (%s, %s) ON CONFLICT DO NOTHING
        """,
        (user_id, change_id),
    )


def send_email(to: str, subject: str, html: str) -> None:
    api_key = os.environ["RESEND_API_KEY"]
    payload = json.dumps(
        {
            "from": os.environ.get("EMAIL_FROM", "RunnersHub <onboarding@resend.dev>"),
            "to": [to],
            "subject": subject,
            "html": html,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        resp.read()


def build_email(item: dict) -> tuple[str, str]:
    site = os.environ.get("SITE_URL", "http://localhost:3000").rstrip("/")
    event_url = f"{site}/events/{item['event_slug']}"
    subject = item["message"]
    official = (
        f'<p><a href="{item["official_url"]}">Inscrever-se no site oficial</a></p>'
        if item.get("official_url")
        else ""
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:520px">
      <h2 style="margin-bottom:4px">🏃 RunnersHub</h2>
      <p style="font-size:16px">{item["message"]}.</p>
      <p><a href="{event_url}">Ver o evento no RunnersHub</a></p>
      {official}
      <hr style="border:none;border-top:1px solid #ddd">
      <p style="color:#777;font-size:12px">
        Você recebeu este aviso porque salvou este evento no seu calendário.
      </p>
    </div>
    """
    return subject, html


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Dispatcher de e-mail do RunnersHub")
    parser.add_argument("--dry-run", action="store_true", help="Não envia nem marca; só mostra")
    args = parser.parse_args(argv)

    _load_dotenv(ROOT / ".env")
    if not args.dry_run and not os.environ.get("RESEND_API_KEY"):
        log.error("RESEND_API_KEY não configurada (use --dry-run para testar sem enviar)")
        return 1

    feed = fetch_feed()
    if not feed:
        log.info("Feed vazio — nada a despachar.")
        return 0
    log.info("%d mudança(s) no feed", len(feed))

    sent = skipped = 0
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        for item in feed:
            recipients = recipients_for(conn, item["event_id"])
            for user_id, email in recipients:
                if already_sent(conn, user_id, item["change_id"]):
                    skipped += 1
                    continue
                subject, html = build_email(item)
                if args.dry_run:
                    log.info("[dry-run] enviaria p/ %s: %s", email, subject)
                    sent += 1
                    continue
                try:
                    send_email(email, subject, html)
                except urllib.error.HTTPError as e:
                    log.error("falha ao enviar p/ %s: %s", email, e)
                    continue
                log_sent(conn, user_id, item["change_id"])
                conn.commit()
                sent += 1
        log.info("%d enviado(s), %d já enviados antes", sent, skipped)

    # Marca o feed como despachado só depois de processar tudo com sucesso.
    if not args.dry_run:
        run_notify_cli("--mark-sent")
        log.info("feed marcado como despachado no ETL")

    return 0


if __name__ == "__main__":
    sys.exit(main())
