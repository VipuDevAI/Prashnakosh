import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import path from "path";

/**
 * Runs Drizzle migrations from the migrations/ directory.
 * Idempotent — safe to call on every startup. Drizzle tracks applied
 * migrations in a __drizzle_migrations journal table.
 */
export async function runMigrations(): Promise<void> {
  // Both in dev (tsx server/index.ts from /app) and production
  // (node dist/server.js from /app), process.cwd() is /app.
  const migrationsFolder = path.join(process.cwd(), "migrations");

  console.log(`[migrate] Running migrations from ${migrationsFolder}...`);

  await migrate(db, { migrationsFolder });
  console.log("[migrate] Migrations applied successfully");
}
