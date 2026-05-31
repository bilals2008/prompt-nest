import { getDatabase } from './db.js'

export async function getAllTags() {
  const db = getDatabase()
  const rows = await db.all('SELECT tags FROM prompts WHERE tags IS NOT NULL AND tags != \'\' AND deleted_at IS NULL')
  const map = {}
  for (const row of rows) {
    const parts = row.tags.split(',').map(t => t.trim()).filter(Boolean)
    for (const tag of parts) {
      const name = tag.includes(':') ? tag.split(':')[0].trim() : tag
      if (!map[name]) map[name] = { name, count: 0, raw: tag }
      map[name].count++
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count)
}

export async function renameTag(oldName, newName) {
  const db = getDatabase()
  const rows = await db.all('SELECT id, tags FROM prompts WHERE tags IS NOT NULL AND tags != \'\' AND deleted_at IS NULL')
  for (const row of rows) {
    const parts = row.tags.split(',').map(t => t.trim()).filter(Boolean)
    const changed = parts.map(t => {
      const { name } = parseTag(t)
      return name.toLowerCase() === oldName.toLowerCase()
        ? t.replace(new RegExp(name, 'i'), newName)
        : t
    })
    const updated = changed.join(', ')
    if (updated !== row.tags) {
      await db.run('UPDATE prompts SET tags = ? WHERE id = ?', [updated, row.id])
    }
  }
}

export async function mergeTags(sourceName, targetName) {
  const db = getDatabase()
  const rows = await db.all('SELECT id, tags FROM prompts WHERE tags IS NOT NULL AND tags != \'\' AND deleted_at IS NULL')
  for (const row of rows) {
    const parts = row.tags.split(',').map(t => t.trim()).filter(Boolean)
    let hadSource = false
    const filtered = parts.filter(t => {
      const { name } = parseTag(t)
      const isSource = name.toLowerCase() === sourceName.toLowerCase()
      if (isSource) hadSource = true
      return !isSource
    })
    if (hadSource && !filtered.some(t => parseTag(t).name.toLowerCase() === targetName.toLowerCase())) {
      filtered.push(targetName)
    }
    const updated = filtered.join(', ')
    if (updated !== row.tags) {
      await db.run('UPDATE prompts SET tags = ? WHERE id = ?', [updated, row.id])
    }
  }
}

export async function deleteTag(tagName) {
  const db = getDatabase()
  const rows = await db.all('SELECT id, tags FROM prompts WHERE tags IS NOT NULL AND tags != \'\' AND deleted_at IS NULL')
  for (const row of rows) {
    const parts = row.tags.split(',').map(t => t.trim()).filter(Boolean)
    const filtered = parts.filter(t => {
      const { name } = parseTag(t)
      return name.toLowerCase() !== tagName.toLowerCase()
    })
    const updated = filtered.join(', ')
    if (updated !== row.tags) {
      await db.run('UPDATE prompts SET tags = ? WHERE id = ?', [updated, row.id])
    }
  }
}

function parseTag(raw) {
  const parts = raw.trim().split(':')
  return { name: parts[0].trim() }
}
