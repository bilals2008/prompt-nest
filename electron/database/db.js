import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { createTables } from './schema.js'

let db = null

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

  await new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[DB] Failed to open database:', err)
        reject(err)
        return
      }
      console.log('[DB] Database opened at:', dbPath)
      resolve()
    })
  })

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
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
