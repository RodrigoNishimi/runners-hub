# RunnersHub

Plataforma web que centraliza eventos de corrida de rua em um único lugar,
permitindo que o usuário explore corridas e monte seu calendário de provas do
ano. Consome os dados do pipeline irmão
[`ETL_pipeline_running_events`](../ETL_pipeline_running_events) (Postgres
canônico + Meilisearch), que é tratado como **somente leitura** — o app só
escreve no schema `app` (contas, calendário pessoal, log de notificações).

## Arquitetura

```
Meilisearch  ←(busca/facetas)─  Next.js (App Router, Vercel)  ─(SELECT)→  Postgres public.* (ETL)
                                       │                                   Postgres app.*   (deste app)
                                       └─ Auth.js (magic link via Resend)
notifier/dispatch.py  ─(consome)→  pipeline.notify --json  →  e-mail (Resend)  [schtasks, pós-ETL]
```

- **Busca/descoberta** (`/events`): Meilisearch via `/api/search` (a chave
  fica no servidor). Filtros na URL: estado, cidade, distância, mês, status,
  preço, "perto de mim" (geolocalização → `_geoRadius`), ordenação data/preço.
- **Página de evento** (`/events/[slug]`): SSR lendo o Postgres, mapa
  Leaflet/OSM, JSON-LD `SportsEvent`, link de inscrição oficial (o RunnersHub
  é agregador — não vende inscrição), `.ics` por evento.
- **Calendário pessoal** (`/calendar`): status `inscrito | quero fazer |
  talvez`, visão mês/lista, exportação `.ics` completa.
- **Auth**: magic link por e-mail (Auth.js v5 + Resend + DrizzleAdapter), sem
  senha. Busca funciona sem login.
- **Notificações**: `notifier/dispatch.py` consome o feed do ETL
  (`pipeline.notify --json`), envia e-mail a quem salvou o evento (dedupe por
  usuário em `app.notification_log`) e depois `--mark-sent`.

## Rodando localmente

Pré-requisitos: Node 20+, o Postgres do ETL populado, e o Meilisearch de dev:

```bash
# no repo do ETL: sobe o Meilisearch e indexa eventos futuros
docker compose up -d search
PYTHONPATH=src MEILI_MASTER_KEY=dev_master_key python -m corridas_etl.serving.search --future-only

# neste repo
cp .env.example .env        # ajuste DATABASE_URL; gere AUTH_SECRET (npx auth secret)
npm install
npx drizzle-kit migrate     # cria o schema app no mesmo Postgres
npm run dev                 # http://localhost:3000
```

O login por e-mail exige `AUTH_RESEND_KEY`; sem ela, a navegação anônima
(busca + página de evento + .ics avulso) funciona normalmente.

## Migrations e banco

- `drizzle/` — migrations do schema `app` (geradas por `drizzle-kit generate`).
- `sql/app_role.sql` — role `app_web` para produção: `SELECT` no `public.*`
  do ETL, escrita só no `app.*`. Aplicar como admin e usar no `DATABASE_URL`
  do site.

## Notificações (produção)

Agendar **depois** do job diário do ETL (mesmo padrão `schtasks`):

```powershell
schtasks /Create /TN "RunnersHubNotifier" /SC DAILY /ST 06:00 `
  /TR "C:\caminho\ETL\.venv\Scripts\python.exe C:\caminho\RunnersHub\notifier\dispatch.py"
```

Teste sem enviar: `python notifier/dispatch.py --dry-run`.

## Deploy (MVP de baixo custo)

| Peça | Onde |
|---|---|
| Postgres (ETL + app) | Neon free tier — ETL aponta `DATABASE_URL` pra lá |
| Meilisearch | Fly.io (imagem `getmeili/meilisearch:v1.8`) — reindexado pelo ETL |
| Site | Vercel Hobby (`npm run build`) |
| E-mail | Resend free tier (magic link + avisos) |

Variáveis na Vercel: `DATABASE_URL` (role `app_web`), `MEILI_URL`,
`MEILI_SEARCH_KEY` (**search-only key**, nunca a master), `AUTH_SECRET`,
`AUTH_RESEND_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`.

## Expansão futura

Componentes e rotas usam nomenclatura genérica (`EventCard`, `/events`) para
permitir outros tipos de evento (trilha, ciclismo, shows) sem renomear a base.