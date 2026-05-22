import { getDatabase } from './db.js'

export async function logActivity(promptId, action) {
  const db = getDatabase()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.run('INSERT INTO activity_log (id, prompt_id, action, created_at) VALUES (?, ?, ?, ?)', [id, promptId, action, now])
  return id
}

export async function getActivity(limit = 50) {
  const db = getDatabase()
  const rows = await db.all(`
    SELECT a.*, p.title as prompt_title, p.content as prompt_content
    FROM activity_log a
    LEFT JOIN prompts p ON a.prompt_id = p.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `, [limit])
  return rows || []
}

export async function clearOldActivity(days = 30) {
  const db = getDatabase()
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()
  await db.run('DELETE FROM activity_log WHERE created_at < ?', [cutoff])
}
