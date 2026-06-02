// File: electron/database/io.js
import { BrowserWindow, dialog } from 'electron'
import fs from 'node:fs'
import { getDatabase } from './db.js'

function csvField(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(prompts) {
  const header = ['title', 'content', 'tags', 'collection_id', 'favorite']
  const rows = [header.join(',')]
  for (const p of prompts) {
    rows.push([
      csvField(p.title),
      csvField(p.content),
      csvField(p.tags || ''),
      csvField(p.collection_id || ''),
      csvField(p.favorite ? 1 : 0),
    ].join(','))
  }
  return rows.join('\n')
}

function parseCSV(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < normalized.length) {
    const ch = normalized[i]
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"' && field === '') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        row.push(field)
        field = ''
        i++
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i++
      } else {
        field += ch
        i++
      }
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export async function exportData(format, options = null) {
  const db = getDatabase()
  const filters = {
    prompts: options?.promptIds ? new Set(options.promptIds) : null,
    collections: options?.collectionIds ? new Set(options.collectionIds) : null,
  }

  let prompts = await db.all('SELECT * FROM prompts ORDER BY created_at DESC')
  let collections = await db.all('SELECT * FROM collections ORDER BY created_at ASC')

  if (filters.collections) {
    const included = new Set(filters.collections)
    collections = collections.filter((c) => included.has(c.id))
    if (filters.prompts) {
      prompts = prompts.filter((p) => filters.prompts.has(p.id) || (p.collection_id && included.has(p.collection_id)))
    } else {
      prompts = prompts.filter((p) => p.collection_id && included.has(p.collection_id))
    }
  } else if (filters.prompts) {
    prompts = prompts.filter((p) => filters.prompts.has(p.id))
  }

  let content, fileFilters, extension

  switch (format) {
    case 'json': {
      content = JSON.stringify({ prompts, collections, exportedAt: new Date().toISOString() }, null, 2)
      fileFilters = [{ name: 'JSON', extensions: ['json'] }]
      extension = 'json'
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
      fileFilters = [{ name: 'Markdown', extensions: ['md'] }]
      extension = 'md'
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
      fileFilters = [{ name: 'Text', extensions: ['txt'] }]
      extension = 'txt'
      break
    }
    case 'csv': {
      content = toCSV(prompts)
      fileFilters = [{ name: 'CSV', extensions: ['csv'] }]
      extension = 'csv'
      break
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: `Export as ${format.toUpperCase()}`,
    defaultPath: `promptnest-export.${extension}`,
    filters: fileFilters,
  })

  if (canceled || !filePath) return { canceled: true }

  fs.writeFileSync(filePath, content, 'utf-8')
  return {
    success: true,
    filePath,
    counts: { prompts: prompts.length, collections: collections.length },
  }
}

export async function importData(filePath = null) {
  const db = getDatabase()
  const win = BrowserWindow.getFocusedWindow()

  let targetPath = filePath
  if (!targetPath) {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Import Prompts',
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    })
    if (canceled || filePaths.length === 0) return { canceled: true }
    targetPath = filePaths[0]
  }

  const raw = fs.readFileSync(targetPath, 'utf-8')
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

export async function importCsv(filePath = null) {
  const db = getDatabase()
  const win = BrowserWindow.getFocusedWindow()

  let targetPath = filePath
  if (!targetPath) {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Import CSV',
      properties: ['openFile'],
      filters: [
        { name: 'CSV File', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (canceled || filePaths.length === 0) return { canceled: true }
    targetPath = filePaths[0]
  }

  const raw = fs.readFileSync(targetPath, 'utf-8')
  const rows = parseCSV(raw)
  if (rows.length < 2) {
    return { error: 'CSV file is empty or missing rows' }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = (name) => header.indexOf(name)
  const titleIdx = idx('title')
  const contentIdx = idx('content')
  const tagsIdx = idx('tags')
  const collectionIdx = idx('collection_id')
  const favoriteIdx = idx('favorite')

  if (titleIdx === -1 || contentIdx === -1) {
    return { error: 'CSV must include "title" and "content" columns' }
  }

  const imported = { prompts: 0, errors: 0 }
  const now = new Date().toISOString()

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const title = (row[titleIdx] || '').trim()
    const content = (row[contentIdx] || '').trim()
    if (!title || !content) { imported.errors++; continue }

    const tags = tagsIdx !== -1 ? (row[tagsIdx] || '').trim() : ''
    const collectionId = collectionIdx !== -1 && row[collectionIdx] ? row[collectionIdx].trim() : null
    const favorite = favoriteIdx !== -1 && /^(1|true|yes)$/i.test((row[favoriteIdx] || '').trim()) ? 1 : 0

    try {
      const id = crypto.randomUUID()
      await db.run(
        'INSERT INTO prompts (id, title, content, tags, collection_id, favorite, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
        [id, title, content, tags, collectionId, favorite, now, now]
      )
      imported.prompts++
    } catch {
      imported.errors++
    }
  }

  return { success: true, ...imported }
}
