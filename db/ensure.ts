import { getRuntimeEnv } from "./runtime";

const schemaSql = `CREATE TABLE IF NOT EXISTS freezer_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  frozen_on TEXT NOT NULL,
  use_within_days INTEGER DEFAULT 90 NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  category TEXT DEFAULT 'Other' NOT NULL,
  image_key TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;

export async function ensureSchema() {
  await getRuntimeEnv().DB.prepare(schemaSql).run();
}
