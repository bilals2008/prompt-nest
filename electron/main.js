import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { initDatabase, closeDatabase, getDatabaseStats, getDashboardStats } from './database/db.js'
import * as prompts from './database/prompts.js'
import * as collections from './database/collections.js'
import * as activity from './database/activity.js'
import * as io from './database/io.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win
const isDev = !app.isPackaged

function sendUpdaterEvent(type, payload = {}) {
  if (!win || win.isDestroyed()) return
  win.webContents.send('updater:event', { type, payload })
}

function setupUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendUpdaterEvent('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    sendUpdaterEvent('update-available', {
      version: info?.version ?? '',
      releaseDate: info?.releaseDate ?? '',
      releaseNotes: info?.releaseNotes ?? '',
    })
  })

  autoUpdater.on('update-not-available', () => {
    sendUpdaterEvent('update-not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendUpdaterEvent('download-progress', {
      percent: progress?.percent ?? 0,
      total: progress?.total ?? 0,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdaterEvent('update-downloaded', { version: info?.version ?? '' })
  })

  autoUpdater.on('error', (error) => {
    sendUpdaterEvent('error', { message: error?.message || 'Auto update failed.' })
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function registerIpcHandlers() {
  if (!isDev) setupUpdater()
  ipcMain.handle('db:createPrompt', (_, data) => prompts.createPrompt(data))
  ipcMain.handle('db:getPromptById', (_, id) => prompts.getPromptById(id))
  ipcMain.handle('db:getAllPrompts', () => prompts.getAllPrompts())
  ipcMain.handle('db:updatePrompt', (_, id, data) => prompts.updatePrompt(id, data))
  ipcMain.handle('db:deletePrompt', (_, id) => prompts.deletePrompt(id))
  ipcMain.handle('db:toggleFavorite', (_, id) => prompts.toggleFavorite(id))
  ipcMain.handle('db:getFavorites', () => prompts.getFavorites())
  ipcMain.handle('db:createCollection', (_, data) => collections.createCollection(data))
  ipcMain.handle('db:getCollections', () => collections.getCollections())
  ipcMain.handle('db:updateCollection', (_, id, data) => collections.updateCollection(id, data))
  ipcMain.handle('db:deleteCollection', (_, id) => collections.deleteCollection(id))
  ipcMain.handle('db:logActivity', (_, promptId, action) => activity.logActivity(promptId, action))
  ipcMain.handle('db:getActivity', (_, limit) => activity.getActivity(limit))
  ipcMain.handle('db:exportData', (_, format) => io.exportData(format))
  ipcMain.handle('db:importData', () => io.importData())
  ipcMain.handle('db:searchPrompts', (_, query, filter) => prompts.searchPrompts(query, filter))
  ipcMain.handle('db:getDashboardStats', () => getDashboardStats())
  ipcMain.handle('db:getTemplates', () => prompts.getTemplates())
  ipcMain.handle('db:createTemplate', (_, data) => prompts.createTemplate(data))
  ipcMain.handle('db:deleteTemplate', (_, id) => prompts.deleteTemplate(id))
  ipcMain.handle('db:getDatabaseStats', () => getDatabaseStats())
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('updater:get-app-version', () => {
    if (isDev) {
      try {
        const pkgPath = path.join(__dirname, '..', 'package.json')
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg?.version) return pkg.version
      } catch {}
    }
    return app.getVersion()
  })
  ipcMain.handle('updater:check-for-updates', async () => {
    if (isDev) return { ok: false, devMode: true, message: 'Packaged builds only.' }
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error?.message }
    }
  })
  ipcMain.handle('updater:download-update', async () => {
    if (isDev) return { ok: false, devMode: true, message: 'Packaged builds only.' }
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error?.message }
    }
  })
  ipcMain.handle('updater:quit-and-install', () => {
    if (isDev) return { ok: false, devMode: true, message: 'Packaged builds only.' }
    setImmediate(() => autoUpdater.quitAndInstall(false, true))
    return { ok: true }
  })
  ipcMain.handle('db:openDbFolder', async () => {
    const dbDir = path.join(app.getPath('userData'), 'PromptNest')
    await shell.openPath(dbDir)
  })
  ipcMain.handle('db:backupDatabase', async () => {
    const dbDir = path.join(app.getPath('userData'), 'PromptNest')
    const dbPath = path.join(dbDir, 'promptnest.db')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(dbDir, `promptnest-backup-${timestamp}.db`)
    fs.copyFileSync(dbPath, backupPath)
    return { success: true, path: backupPath }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  await initDatabase()
  registerIpcHandlers()
  createWindow()
})

app.on('will-quit', () => {
  closeDatabase()
})
