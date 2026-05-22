import { BrowserWindow, dialog } from 'electron'
import fs from 'node:fs'
import { getDatabase } from './db.js'

export async function exportData(format) {
  const db = getDatabase()
  const prompts = await db.all('SELECT * FROM prompts ORDER BY created_at DESC')
  const collections = await db.all('SELECT * FROM collections ORDER BY created_at ASC')

  let content, filters

  switch (format) {
    case 'json': {
      content = JSON.stringify({ prompts, collections, exportedAt: new Date().toISOString() }, null, 2)
      filters = [{ name: 'JSON', extensions: ['json'] }]
      break
    }
    case 'markdown': {
      let md = '# Prompt Nest Export\n\n'
      md += `Exported: ${new Date().toLocaleString()}\n\n---\n\n`
      for (const p of prompts) {
        md += `## ${p.title}\n\n`
        if (p.tags) md += `**Tags:** ${p.tags}\n\n`
        md += `${p.content}\n\n`
        md += `_Created: ${new Date(p.created_at).toLocaleString()} | Updated: ${new Date(p.updated_at).toLocaleString()}_\n\n---\n\n`
      }
      content = md
      filters = [{ name: 'Markdown', extensions: ['md'] }]
      break
    }
    case 'txt': {
      let txt = ''
      for (const p of prompts) {
        txt += `${'='.repeat(60)}\n`
        txt += `TITLE: ${p.title}\n`
        if (p.tags) txt += `TAGS: ${p.tags}\n`
        txt += `${'='.repeat(60)}\n`
        txt += `${p.content}\n\n`
      }
      content = txt
      filters = [{ name: 'Text', extensions: ['txt'] }]
      break
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: `Export as ${format.toUpperCase()}`,
    defaultPath: `promptnest-export.${format === 'markdown' ? 'md' : format}`,
    filters,
  })

  if (canceled || !filePath) return { canceled: true }

  fs.writeFileSync(filePath, content, 'utf-8')
  return { success: true, filePath }
}

export async function importData() {
  const db = getDatabase()
  const win = BrowserWindow.getFocusedWindow()

  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import Prompts',
    properties: ['openFile'],
    filters: [
      { name: 'JSON Backup', extensions: ['json'] },
    ],
  })

  if (canceled || filePaths.length === 0) return { canceled: true }

  const raw = fs.readFileSync(filePaths[0], 'utf-8')
  let data

  try {
    data = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON file' }
  }

  const imported = { prompts: 0, collections: 0, errors: 0 }

  if (Array.isArray(data.collections)) {
    const existing = await db.all('SELECT id FROM collections')
    const existingIds = new Set(existing.map((c) => c.id))
    for (const col of data.collections) {
      try {
        if (existingIds.has(col.id)) {
          await db.run('UPDATE collections SET name = ?, icon = ? WHERE id = ?', [col.name, col.icon || 'folder', col.id])
        } else {
          await db.run('INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)', [col.id || crypto.randomUUID(), col.name, col.icon || 'folder', col.created_at || new Date().toISOString()])
        }
        imported.collections++
      } catch { imported.errors++ }
    }
  }

  if (Array.isArray(data.prompts)) {
    for (const p of data.prompts) {
      try {
        const existing = await db.get('SELECT id FROM prompts WHERE id = ?', [p.id])
        if (existing) {
          await db.run('UPDATE prompts SET title = ?, content = ?, tags = ?, collection_id = ?, favorite = ?, is_template = ?, updated_at = ? WHERE id = ?', [p.title, p.content, p.tags || '', p.collection_id || null, p.favorite || 0, p.is_template || 0, new Date().toISOString(), p.id])
        } else {
          await db.run('INSERT INTO prompts (id, title, content, tags, collection_id, favorite, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [p.id || crypto.randomUUID(), p.title, p.content, p.tags || '', p.collection_id || null, p.favorite || 0, p.is_template || 0, p.created_at || new Date().toISOString(), new Date().toISOString()])
        }
        imported.prompts++
      } catch { imported.errors++ }
    }
  }

  return { success: true, ...imported }
}
