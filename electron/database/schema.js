// File: electron/database/schema.js
import { getDatabase } from './db.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  collection_id TEXT,
  favorite INTEGER DEFAULT 0,
  is_template INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  prompt_id TEXT,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`

export async function createTables() {
  const db = getDatabase()
  await db.exec(SCHEMA)

  const columns = await db.all('PRAGMA table_info(prompts)')
  const hasIsTemplate = columns.some((c) => c.name === 'is_template')
  if (!hasIsTemplate) {
    await db.run('ALTER TABLE prompts ADD COLUMN is_template INTEGER DEFAULT 0')
  }
}
