# RunnersHub

Plataforma web que centraliza eventos de corrida de rua em um único lugar,
permitindo que o usuário explore corridas e monte seu calendário de provas do
ano. Consome os dados do pipeline irmão
[`ETL_pipeline_running_events`](../ETL_pipeline_running_events) (Postgres
canônico), que é tratado como **somente leitura** — o app só
escreve no schema `app` (contas, calendário pessoal, log de notificações).

## Arquitetura

```
Next.js (App Router, Vercel)  ─(SELECT: dados + busca/facetas)→  Postgres public.* (ETL)
       │                                                         Postgres app.*   (deste app)
       └─ Auth.js (Google OAuth + DrizzleAdapter)
notifier/dispatch.py  ─(consome)→  pipeline.notify --json  →  e-mail (Resend)  [schtasks, pós-ETL]
```

- **Busca/descoberta** (`/events`): direto no Postgres (`src/lib/search.ts`),
  sem serviço externo — texto fuzzy via `pg_trgm`/`unaccent`, "perto de mim"
  via haversine em SQL puro (lat/long numéricos; não requer PostGIS), facetas
  via `GROUP BY`. Filtros na URL: estado, cidade, distância, mês, status,
  preço, geolocalização, ordenação data/preço.
  Requer o `sql/008_search.sql` do ETL aplicado no banco.
- **Página de evento** (`/events/[slug]`): SSR lendo o Postgres, mapa
  Leaflet/OSM, JSON-LD `SportsEvent`, link de inscrição oficial (o RunnersHub
  é agregador — não vende inscrição), `.ics` por evento.
- **Calendário pessoal** (`/calendar`): status `inscrito | quero fazer |
  talvez`, visão mês/lista, exportação `.ics` completa.
- **Auth**: login com Google (Auth.js v5 + provider Google OAuth +
  DrizzleAdapter), sem senha. Busca funciona sem login.
- **Notificações**: `notifier/dispatch.py` consome o feed do ETL
  (`pipeline.notify --json`), envia e-mail a quem salvou o evento (dedupe por
  usuário em `app.notification_log`) e depois `--mark-sent`.

## Rodando localmente

Pré-requisitos: Node 20+ e o Postgres do ETL populado (com o
`sql/008_search.sql` aplicado — extensões `pg_trgm`/`unaccent` e o índice de
busca):

```bash
cp .env.example .env        # ajuste DATABASE_URL; gere AUTH_SECRET (npx auth secret)
npm install
npx drizzle-kit migrate     # cria o schema app no mesmo Postgres
npm run dev                 # http://localhost:3000
```

O login exige `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (crie um OAuth client
no Google Cloud Console — ver DEPLOY.md); sem eles, a navegação anônima (busca
+ página de evento + .ics avulso) funciona normalmente.

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
| Postgres (ETL + app + busca) | Neon free tier — ETL aponta `DATABASE_URL` pra lá |
| Site | Vercel Hobby (`npm run build`) |
| Login | Google OAuth (Google Cloud Console, grátis) |
| E-mail | Resend free tier (avisos do notifier) |

Variáveis na Vercel: `DATABASE_URL` (role `app_web`), `AUTH_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL`.
(`RESEND_API_KEY`/`EMAIL_FROM` são só do notifier local, não vão pra Vercel.)

## Identidade visual

Tema "night run": fundo escuro premium com acento volt, pensado para o app
mobile seguir a mesma linguagem.

**Cores** (Tailwind v4, tokens em `src/app/globals.css`)

| Papel | Valor | Uso |
|---|---|---|
| Fundo | `zinc-950` (`#09090b`) | base de toda a UI, `color-scheme: dark` |
| Superfície | `zinc-900/70` sobre `zinc-950` | cards, painéis, inputs |
| Borda sutil | `white/10` | contorno de cards, inputs, divisores |
| Acento (volt) | `lime-400` (`#a3e635`) | CTAs primários, links ativos, destaques de preço/data |
| Acento secundário | `sky-400`, `emerald-400`, `amber-400`, `rose-400` | badges de status (inscrições abertas/encerradas/esgotado), chips do calendário (`inscrito`/`quero fazer`/`talvez`) |
| Texto primário | `zinc-50`/`zinc-100` | títulos, texto de destaque |
| Texto secundário | `zinc-400`/`zinc-500` | metadados, legendas |

Badges e chips usam o padrão `bg-{cor}-400/15 text-{cor}-300 ring-1 ring-inset
ring-{cor}-400/30` (fundo translúcido + anel), não preenchimento sólido — ver
`STATUS_STYLES` em `src/lib/format.ts` e `SAVED_STATUS_STYLES` em
`src/lib/calendar.ts` como fonte única de verdade das cores de status.

**Tipografia** (`next/font/google`, configurada em `src/app/layout.tsx`)

- **Space Grotesk** (`--font-space-grotesk`, classe utilitária `font-display`)
  — títulos (`h1`–`h3`), nome do evento no card, valores de preço/data em
  destaque. Geométrica, com personalidade — assina a marca.
- **Inter** (`--font-inter`, default do `font-sans`) — corpo de texto, labels,
  inputs, navegação.

**Formas e efeitos**

- Raio de borda generoso: `rounded-xl`/`rounded-2xl` em cards e botões,
  `rounded-full` em badges, chips e CTAs de pílula.
- Glassmorphism leve: `backdrop-blur-md` + fundo translúcido em badges sobre
  imagem (status do card, data) e no header sticky.
- Glow de fundo fixo (`body::before` em `globals.css`): dois radiais suaves
  (lime e sky) no topo da viewport, decorativos, não interativos.
- Hover em cards/links: elevação (`-translate-y-1`) + sombra colorida em volt
  (`shadow-[0_24px_48px_-20px_rgba(163,230,53,0.25)]`), não apenas mudança de
  cor.
- Micro-animação de entrada: `animate-fade-up` (fade + subida de 12px) em
  cards e cabeçalhos de página.
- Ícones: SVGs de traço (`stroke="currentColor"`, sem preenchimento) em
  `src/components/icons.tsx` — sem lib externa, sem emoji na UI de produção.

**Referências de implementação**: `src/app/globals.css` (tokens e tema base),
`src/components/EventCard.tsx` (card premium com imagem/badges/hover),
`src/components/SiteHeader.tsx` (header com blur e marca).

## Expansão futura

Componentes e rotas usam nomenclatura genérica (`EventCard`, `/events`) para
permitir outros tipos de evento (trilha, ciclismo, shows) sem renomear a base.