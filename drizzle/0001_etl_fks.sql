-- FKs para as tabelas canonicas do ETL (schema public). Declaradas aqui (e
-- nao no schema Drizzle) porque public.* pertence ao pipeline, nao ao app.
ALTER TABLE "app"."saved_event"
  ADD CONSTRAINT "saved_event_event_id_fk"
  FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "app"."notification_log"
  ADD CONSTRAINT "notification_log_event_change_id_fk"
  FOREIGN KEY ("event_change_id") REFERENCES "public"."event_change"("id") ON DELETE CASCADE;
