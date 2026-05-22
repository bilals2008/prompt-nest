import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initDatabase, closeDatabase } from './database/db.js'
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
