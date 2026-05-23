import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { createTables } from './schema.js'

let db = null

function wrap(db) {
  return {
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err)
          else resolve(this)
        })
      })
    },
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
    },
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    },
    exec(sql) {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    },
  }
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export async function initDatabase() {
  if (db) return db

  const dbDir = path.join(app.getPath('userData'), 'PromptNest')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'promptnest.db')

  const raw = await new Promise((resolve, reject) => {
    const d = new sqlite3.Database(dbPath, (err) => {
      if (err) { reject(err); return }
      resolve(d)
    })
  })

  db = wrap(raw)

  await db.run('PRAGMA journal_mode = WAL')
  await db.run('PRAGMA foreign_keys = ON')
  await createTables()
  await seedData()

  console.log('[DB] Database initialized successfully')
  return db
}

async function seedData() {
  const row = await db.get('SELECT COUNT(*) as count FROM prompts')
  if (row.count > 0) return

  const now = new Date().toISOString()
  const insert = 'INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

  await db.run(insert, [crypto.randomUUID(), 'React Component Generator', 'Create a reusable React component with PropTypes, default props, and proper state management. Include a loading state, empty state, and error boundary.', 'react, component, frontend', null, 1, now, now])
  await db.run(insert, [crypto.randomUUID(), 'UI Design Critique', 'Review this UI design for consistency, accessibility, color contrast, typography hierarchy, spacing, and responsive behavior. Provide specific actionable feedback.', 'design, ui, review', null, 0, now, now])
  await db.run(insert, [crypto.randomUUID(), 'Marketing Email Copy', 'Write a compelling marketing email for our new product launch. The tone should be professional yet friendly. Include subject line options, body copy, and a clear CTA.', 'marketing, copywriting, email', null, 1, now, now])

  const tplInsert = 'INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)'
  await db.run(tplInsert, [crypto.randomUUID(), 'Code Review Checklist', 'Review this code for:\n- Correctness: Does it handle edge cases?\n- Performance: Any obvious bottlenecks?\n- Readability: Is the intent clear?\n- Security: Any injection or validation issues?\n- Testing: Are there unit tests?', 'code, review, checklist', now, now])
  await db.run(tplInsert, [crypto.randomUUID(), 'Meeting Notes', '## Agenda\n- \n- \n\n## Discussion Points\n1. \n2. \n3. \n\n## Action Items\n- [ ] \n- [ ] \n\n## Decisions\n- ', 'meetings, productivity', now, now])
  await db.run(tplInsert, [crypto.randomUUID(), 'Brainstorming Session', '## Problem Statement\n\n## Ideas\n- \n- \n- \n\n## Constraints\n- \n- \n\n## Next Steps\n1. \n2. ', 'creative, brainstorming', now, now])
}

export function closeDatabase() {
  if (db) {
    db.run('PRAGMA optimize')
  }
  db = null
}

export async function getDashboardStats() {
  const d = getDatabase()
  const totalPrompts = await d.get('SELECT COUNT(*) as count FROM prompts WHERE is_template = 0')
  const collections = await d.get('SELECT COUNT(*) as count FROM collections')
  const totalTemplates = await d.get('SELECT COUNT(*) as count FROM prompts WHERE is_template = 1')
  const thisWeek = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0 AND created_at >= datetime('now', '-7 days')")
  const prevWeek = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0 AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')")
  const lastWeekNew = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0 AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')")
  return {
    totalPrompts: totalPrompts?.count || 0,
    collections: collections?.count || 0,
    totalTemplates: totalTemplates?.count || 0,
    thisWeek: thisWeek?.count || 0,
    prevWeekPrompts: prevWeek?.count || 0,
  }
}

export async function getDatabaseStats() {
  const d = getDatabase()
  const promptCount = await d.get('SELECT COUNT(*) as count FROM prompts')
  const collectionCount = await d.get('SELECT COUNT(*) as count FROM collections')
  const favoriteCount = await d.get('SELECT COUNT(*) as count FROM prompts WHERE favorite = 1')
  const dbPath = path.join(app.getPath('userData'), 'PromptNest', 'promptnest.db')
  let size = 0
  try { size = fs.statSync(dbPath).size } catch {}
  return {
    prompts: promptCount?.count || 0,
    collections: collectionCount?.count || 0,
    favorites: favoriteCount?.count || 0,
    size,
    path: dbPath,
  }
}
