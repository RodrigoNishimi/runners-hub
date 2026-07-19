-- Role usada pelo site em producao: leitura nas tabelas do ETL (public),
-- escrita so no schema app. Aplicar uma vez, como admin do banco:
--   psql "$DATABASE_URL" -f sql/app_role.sql
-- e usar app_web no DATABASE_URL do site (a senha e placeholder — troque).

DO $$ BEGIN
  CREATE ROLE app_web LOGIN PASSWORD 'CHANGE_ME';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO app_web;
GRANT SELECT ON public.event, public.event_distance,
               public.organizer, public.event_change TO app_web;

GRANT USAGE ON SCHEMA app TO app_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_web;
