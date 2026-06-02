import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { initDatabase, closeDatabase, getDatabaseStats, getDashboardStats, getTotalActivityCount, getSetting, setSetting } from './database/db.js'
import * as prompts from './database/prompts.js'
import * as collections from './database/collections.js'
import * as activity from './database/activity.js'
import * as tags from './database/tags.js'
import * as io from './database/io.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win
const isDev = !app.isPackaged
let updaterReady = false
let updateCheckInProgress = false
let updateDownloadInProgress = false

function writeUpdaterLog(level, message) {
  if (isDev) return
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(
      path.join(logDir, 'updater.log'),
      `[${new Date().toISOString()}] [${level}] ${message}\n`
    )
  } catch (error) {
    console.error('Unable to write updater log', error)
  }
}

const updaterLogger = {
  info: (message) => writeUpdaterLog('info', String(message)),
  warn: (message) => writeUpdaterLog('warn', String(message)),
  error: (message) => writeUpdaterLog('error', String(message)),
  debug: (message) => writeUpdaterLog('debug', String(message)),
}

function sendUpdaterEvent(type, payload = {}) {
  if (!win || win.isDestroyed()) return
  win.webContents.send('updater:event', { type, payload })
}

function setupUpdater() {
  if (updaterReady) return
  updaterReady = true

  autoUpdater.logger = updaterLogger
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.disableWebInstaller = true
  autoUpdater.disableDifferentialDownload = false

  if (app.getVersion().includes('-')) {
    autoUpdater.allowPrerelease = true
  }

  autoUpdater.on('checking-for-update', () => {
    writeUpdaterLog('info', 'Checking for update')
    sendUpdaterEvent('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    writeUpdaterLog('info', `Update available: ${info.version}`)
    sendUpdaterEvent('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
      updateType: 'full',
    })
  })

  autoUpdater.on('update-not-available', () => {
    writeUpdaterLog('info', 'No update available')
    sendUpdaterEvent('update-not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendUpdaterEvent('download-progress', {
      percent: progress.percent,
      total: progress.total,
      transferred: progress.transferred,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloadInProgress = false
    writeUpdaterLog('info', `Update downloaded: ${info.version}`)
    sendUpdaterEvent('update-downloaded', { version: info.version })
  })

  autoUpdater.on('error', (error) => {
    updateCheckInProgress = false
    updateDownloadInProgress = false
    writeUpdaterLog('error', error?.stack || error?.message || 'Update error')
    sendUpdaterEvent('error', { message: error?.message || 'Update error' })
  })

  autoUpdater.on('update-cancelled', () => {
    updateDownloadInProgress = false
    writeUpdaterLog('warn', 'Update download cancelled')
    sendUpdaterEvent('update-cancelled')
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
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
  ipcMain.handle('db:togglePin', (_, id) => prompts.togglePin(id))
  ipcMain.handle('db:toggleFavorite', (_, id) => prompts.toggleFavorite(id))
  ipcMain.handle('db:getFavorites', () => prompts.getFavorites())
  ipcMain.handle('db:createCollection', (_, data) => collections.createCollection(data))
  ipcMain.handle('db:getCollections', () => collections.getCollections())
  ipcMain.handle('db:updateCollection', (_, id, data) => collections.updateCollection(id, data))
  ipcMain.handle('db:deleteCollection', (_, id) => collections.deleteCollection(id))
  ipcMain.handle('db:batchDeleteCollections', (_, ids) => collections.batchDeleteCollections(ids))
  ipcMain.handle('db:logActivity', async (_, promptId, action) => {
    return activity.logActivity(promptId, action)
  })
  ipcMain.handle('db:getActivity', (_, limit) => activity.getActivity(limit))
  ipcMain.handle('db:exportData', (_, format, options) => io.exportData(format, options))
  ipcMain.handle('db:importData', (_, filePath) => io.importData(filePath))
  ipcMain.handle('db:importCsv', (_, filePath) => io.importCsv(filePath))
  ipcMain.handle('db:searchPrompts', (_, query, filter) => prompts.searchPrompts(query, filter))
  ipcMain.handle('db:getDashboardStats', () => getDashboardStats())
  ipcMain.handle('db:getTemplates', () => prompts.getTemplates())
  ipcMain.handle('db:createTemplate', (_, data) => prompts.createTemplate(data))
  ipcMain.handle('db:deleteTemplate', (_, id) => prompts.deleteTemplate(id))
  ipcMain.handle('db:batchDeletePrompts', (_, ids) => prompts.batchDeletePrompts(ids))
  ipcMain.handle('db:batchSetFavorite', (_, ids, favorite) => prompts.batchSetFavorite(ids, favorite))
  ipcMain.handle('db:batchSetCollection', (_, ids, collectionId) => prompts.batchSetCollection(ids, collectionId))
  ipcMain.handle('db:getDatabaseStats', () => getDatabaseStats())
  ipcMain.handle('db:getSetting', (_, key) => getSetting(key))
  ipcMain.handle('db:setSetting', (_, key, value) => setSetting(key, value))
  ipcMain.handle('tags:getAll', () => tags.getAllTags())
  ipcMain.handle('tags:rename', (_, oldName, newName) => tags.renameTag(oldName, newName))
  ipcMain.handle('tags:merge', (_, source, target) => tags.mergeTags(source, target))
  ipcMain.handle('tags:delete', (_, tagName) => tags.deleteTag(tagName))
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
    if (isDev) { sendUpdaterEvent('update-not-available'); return { ok: false, devMode: true } }
    if (updateCheckInProgress) return { ok: true, inProgress: true }
    try {
      updateCheckInProgress = true
      await autoUpdater.checkForUpdates()
      updateCheckInProgress = false
      return { ok: true }
    } catch (error) {
      updateCheckInProgress = false
      sendUpdaterEvent('error', { message: error?.message || 'Update check failed' })
      return { ok: false, message: error?.message }
    }
  })

  ipcMain.handle('updater:download-update', async () => {
    if (isDev) return { ok: false, devMode: true, message: 'Packaged builds only.' }
    if (updateDownloadInProgress) return { ok: true, inProgress: true }
    try {
      updateDownloadInProgress = true
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (error) {
      updateDownloadInProgress = false
      sendUpdaterEvent('error', { message: error?.message || 'Download failed' })
      return { ok: false, message: error?.message }
    }
  })

  ipcMain.handle('updater:quit-and-install', () => {
    if (isDev) return { ok: false, devMode: true, message: 'Packaged builds only.' }
    setImmediate(() => autoUpdater.quitAndInstall(false, true))
    return { ok: true }
  })

  ipcMain.handle('updater:pause-download', () => {
    return { ok: false, unsupported: true, message: 'Pause is not supported by electron-updater.' }
  })

  ipcMain.handle('updater:resume-download', () => {
    return { ok: false, unsupported: true, message: 'Resume is not supported by electron-updater.' }
  })
  ipcMain.handle('app:getAutoStart', () => {
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('app:setAutoStart', (_, enable) => {
    app.setLoginItemSettings({ openAtLogin: enable })
    return enable
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
    updateLastBackup(timestamp)
    return { success: true, path: backupPath }
  })
  ipcMain.handle('app:hideWindow', () => {
    win?.minimize()
  })
}

const APP_START_TIME = Date.now()

function updateLastBackup(timestamp) {
  const metaPath = path.join(app.getPath('userData'), 'PromptNest', 'meta.json')
  let meta = {}
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) } catch {}
  meta.lastBackup = timestamp
  fs.writeFileSync(metaPath, JSON.stringify(meta))
}

let sessionCount = 0
function initSessionCount() {
  const metaPath = path.join(app.getPath('userData'), 'PromptNest', 'meta.json')
  let meta = {}
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) } catch {}
  sessionCount = (meta.sessionCount || 0) + 1
  meta.sessionCount = sessionCount
  fs.writeFileSync(metaPath, JSON.stringify(meta))
}

function getMeta() {
  const metaPath = path.join(app.getPath('userData'), 'PromptNest', 'meta.json')
  try { return JSON.parse(fs.readFileSync(metaPath, 'utf8')) } catch { return {} }
}

function registerAppInfoHandlers() {
  ipcMain.handle('app:getVersions', () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    v8: process.versions.v8,
  }))
  ipcMain.handle('app:getUptime', () => Date.now() - APP_START_TIME)
  ipcMain.handle('app:getSessionCount', () => sessionCount)
  ipcMain.handle('app:getLastBackup', () => {
    const meta = getMeta()
    return meta.lastBackup || null
  })
  ipcMain.handle('app:getTotalActivity', async () => {
    try { return await getTotalActivityCount() }
    catch { return 0 }
  })
  ipcMain.handle('app:getDiskFree', async () => {
    try {
      const userDataPath = app.getPath('userData')
      const { execSync } = await import('node:child_process')
      const cmd = `powershell -Command "(Get-PSDrive -Name $((Get-Item '${userDataPath.replace(/'/g, "''")}').PSDrive.Name)).Free"`
      const out = execSync(cmd, { encoding: 'utf8', timeout: 3000 }).trim()
      return parseInt(out, 10) || 0
    } catch { return 0 }
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
  initSessionCount()
  registerIpcHandlers()
  registerAppInfoHandlers()
  createWindow()

  // Register global shortcut for Spotlight/Quick Search
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      if (!win.isVisible()) win.show()
      win.focus()
      win.webContents.send('app:global-search')
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})
