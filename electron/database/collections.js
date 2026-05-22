import { getDatabase } from './db.js'

export async function createCollection({ name, icon = 'folder' }) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.run('INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)', [id, name, icon, now])
  return getCollectionById(id)
}

async function getCollectionById(id) {
  const db = getDatabase()
  const row = await db.get('SELECT * FROM collections WHERE id = ?', [id])
  return row || null
}

export async function getCollections() {
  const db = getDatabase()
  return db.all('SELECT * FROM collections ORDER BY created_at ASC')
}

export async function updateCollection(id, { name, icon }) {
  const db = getDatabase()
  await db.run('UPDATE collections SET name = ?, icon = ? WHERE id = ?', [name, icon || 'folder', id])
  return getCollectionById(id)
}

export async function deleteCollection(id) {
  const db = getDatabase()
  await db.run('UPDATE prompts SET collection_id = NULL WHERE collection_id = ?', [id])
  await db.run('DELETE FROM collections WHERE id = ?', [id])
  return { success: true }
}
