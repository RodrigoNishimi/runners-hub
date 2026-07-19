import {
  bigint,
  integer,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// Tudo do RunnersHub vive no schema "app"; o schema "public" (event,
// event_distance, organizer, event_change) pertence ao ETL e e read-only.
export const app = pgSchema("app");

export const savedEventStatus = app.enum("saved_event_status", [
  "registered",
  "want",
  "maybe",
]);

export const users = app.table("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = app.table(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = app.table("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = app.table(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// Calendario pessoal: um usuario marca um evento canonico (public.event.id)
// com um status. A FK para public.event nao e declarada aqui porque a tabela
// nao pertence a este schema Drizzle; a migration SQL adiciona a constraint.
export const savedEvents = app.table(
  "saved_event",
  {
    id: bigint("id", { mode: "number" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: bigint("event_id", { mode: "number" }).notNull(),
    status: savedEventStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("saved_event_user_event_uq").on(t.userId, t.eventId)],
);

// Dedupe de envio por destinatario: event_change.notified_at do ETL e global
// ("ja entrou no feed"); aqui registramos cada par (usuario, mudanca) enviado.
export const notificationLog = app.table(
  "notification_log",
  {
    id: bigint("id", { mode: "number" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventChangeId: bigint("event_change_id", { mode: "number" }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("notification_log_user_change_uq").on(
      t.userId,
      t.eventChangeId,
    ),
  ],
);

export type SavedEventStatus = (typeof savedEventStatus.enumValues)[number];
