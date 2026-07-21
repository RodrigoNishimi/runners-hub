-- Role usada pelo site em producao: leitura nas tabelas do ETL (public),
-- escrita so no schema app. Aplicar uma vez, como admin do banco:
--   psql "$DATABASE_URL" -f sql/app_role.sql
-- e usar app_web no DATABASE_URL do site (a senha e placeholder — troque).
-- Obs: o Neon valida a forca da senha no control plane, entao o placeholder
-- precisa misturar maiuscula/minuscula/numero/especial (nao pode ser algo
-- trivial tipo "CHANGE_ME").

DO $$ BEGIN
  CREATE ROLE app_web LOGIN PASSWORD 'Ch4nge-Me-Pls!2026';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO app_web;
GRANT SELECT ON public.event, public.event_distance,
               public.organizer, public.event_change TO app_web;

GRANT USAGE ON SCHEMA app TO app_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_web;
