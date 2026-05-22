// File: electron/preload.js
import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('db', {
  createPrompt: (data) => ipcRenderer.invoke('db:createPrompt', data),
  getPromptById: (id) => ipcRenderer.invoke('db:getPromptById', id),
  getAllPrompts: () => ipcRenderer.invoke('db:getAllPrompts'),
  updatePrompt: (id, data) => ipcRenderer.invoke('db:updatePrompt', id, data),
  deletePrompt: (id) => ipcRenderer.invoke('db:deletePrompt', id),
  toggleFavorite: (id) => ipcRenderer.invoke('db:toggleFavorite', id),
  getFavorites: () => ipcRenderer.invoke('db:getFavorites'),
  createCollection: (data) => ipcRenderer.invoke('db:createCollection', data),
  getCollections: () => ipcRenderer.invoke('db:getCollections'),
  updateCollection: (id, data) => ipcRenderer.invoke('db:updateCollection', id, data),
  deleteCollection: (id) => ipcRenderer.invoke('db:deleteCollection', id),
  logActivity: (promptId, action) => ipcRenderer.invoke('db:logActivity', promptId, action),
  getActivity: (limit) => ipcRenderer.invoke('db:getActivity', limit),
  exportData: (format) => ipcRenderer.invoke('db:exportData', format),
  importData: () => ipcRenderer.invoke('db:importData'),
  getDatabaseStats: () => ipcRenderer.invoke('db:getDatabaseStats'),
  openDbFolder: () => ipcRenderer.invoke('db:openDbFolder'),
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
})
