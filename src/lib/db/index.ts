import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

// Reuso da conexao entre hot-reloads em dev e entre invocacoes serverless.
const client =
  globalThis.__pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    prepare: false,
  });
globalThis.__pgClient = client;

export const db = drizzle(client, { schema });
export const sql = client;
