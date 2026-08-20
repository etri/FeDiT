import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface BaselineOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function baselineMigrationsIfNeeded(
  options: BaselineOptions,
): Promise<void> {
  const probe = new DataSource({ type: 'postgres', ...options });
  await probe.initialize();
  try {
    const [{ exists }] = await probe.query(
      `SELECT to_regclass('public.roles') IS NOT NULL AS exists`,
    );
    if (!exists) return;

    await probe.query(
      `CREATE TABLE IF NOT EXISTS "migrations" ("id" SERIAL NOT NULL, "timestamp" bigint NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_migrations" PRIMARY KEY ("id"))`,
    );
    const [{ count }] = await probe.query(
      `SELECT count(*)::int AS count FROM "migrations"`,
    );
    if (count > 0) return;

    await probe.query(
      `INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`,
      [1781071485727, 'InitialSchema1781071485727'],
    );
    new Logger('DatabaseBaseline').log(
      'Existing schema with empty migrations ledger detected — recorded InitialSchema1781071485727 as applied',
    );
  } finally {
    await probe.destroy();
  }
}
