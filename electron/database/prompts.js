// File: electron/database/prompts.js
import { getDatabase } from './db.js'

export async function createPrompt({ title, content, tags = '', collection_id = null }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.run(
    'INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
    [id, title, content, tags, collection_id, now, now]
  )
  return getPromptById(id)
}

export async function getPromptById(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM prompts WHERE id = ?', [id])
  return row || null
}

export async function getAllPrompts() {
  const db = getDatabase()
  return db.all('SELECT * FROM prompts ORDER BY created_at DESC')
}

export async function getFavorites() {
  const db = getDatabase()
  return db.all('SELECT * FROM prompts WHERE favorite = 1 ORDER BY updated_at DESC')
}

export async function updatePrompt(id, { title, content, tags, collection_id }) {
  const db = getDatabase()
  const now = new Date().toISOString()
  const sets = []
  const values = []
  if (title !== undefined) { sets.push('title = ?'); values.push(title) }
  if (content !== undefined) { sets.push('content = ?'); values.push(content) }
  if (tags !== undefined) { sets.push('tags = ?'); values.push(tags) }
  if (collection_id !== undefined) { sets.push('collection_id = ?'); values.push(collection_id) }
  sets.push('updated_at = ?')
  values.push(now)
  values.push(id)
  await db.run(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`, values)
  return getPromptById(id)
}

export async function deletePrompt(id) {
  const db = getDatabase()
  await db.run('DELETE FROM prompts WHERE id = ?', [id])
  return { success: true }
}

export async function toggleFavorite(id) {
  const db = getDatabase()
  const prompt = await getPromptById(id)
  if (!prompt) return null
  const newVal = prompt.favorite ? 0 : 1
  await db.run('UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?', [newVal, new Date().toISOString(), id])
  return getPromptById(id)
}

export async function getTemplates() {
  const db = getDatabase()
  return db.all('SELECT * FROM prompts WHERE is_template = 1 ORDER BY updated_at DESC')
}

export async function createTemplate({ title, content, tags = '' }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.run(
    'INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
    [id, title, content, tags, now, now]
  )
  return getPromptById(id)
}

export async function deleteTemplate(id) {
  const db = getDatabase()
  await db.run('DELETE FROM prompts WHERE id = ? AND is_template = 1', [id])
  return { success: true }
}

export async function searchPrompts(query, filter = 'all') {
  const db = getDatabase()
  const q = `%${query}%`
  let sql = `
    SELECT p.*, c.name as collection_name
    FROM prompts p
    LEFT JOIN collections c ON p.collection_id = c.id
    WHERE p.is_template = 0 AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ? OR c.name LIKE ?)
  `
  if (filter === 'favorites') sql += ' AND p.favorite = 1'
  if (filter === 'recent') sql += " AND p.updated_at >= datetime('now', '-7 days')"
  sql += ' ORDER BY p.updated_at DESC LIMIT 100'
  return db.all(sql, [q, q, q, q])
}
