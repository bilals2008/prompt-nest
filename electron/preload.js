// File: electron/preload.js
import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdaterEvent: (listener) => {
    const handler = (_event, data) => listener(data)
    ipcRenderer.on('updater:event', handler)
    return () => ipcRenderer.removeListener('updater:event', handler)
  },
  onGlobalSearch: (listener) => {
    const handler = () => listener()
    ipcRenderer.on('app:global-search', handler)
    return () => ipcRenderer.removeListener('app:global-search', handler)
  },
  hideWindow: () => ipcRenderer.invoke('app:hideWindow'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  updater: {
    getAppVersion: () => ipcRenderer.invoke('updater:get-app-version'),
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    pauseDownload: () => ipcRenderer.invoke('updater:pause-download'),
    resumeDownload: () => ipcRenderer.invoke('updater:resume-download'),
  },
})

contextBridge.exposeInMainWorld('db', {
  createPrompt: (data) => ipcRenderer.invoke('db:createPrompt', data),
  getPromptById: (id) => ipcRenderer.invoke('db:getPromptById', id),
  getAllPrompts: () => ipcRenderer.invoke('db:getAllPrompts'),
  updatePrompt: (id, data) => ipcRenderer.invoke('db:updatePrompt', id, data),
  deletePrompt: (id) => ipcRenderer.invoke('db:deletePrompt', id),
  toggleFavorite: (id) => ipcRenderer.invoke('db:toggleFavorite', id),
  togglePin: (id) => ipcRenderer.invoke('db:togglePin', id),
  getFavorites: () => ipcRenderer.invoke('db:getFavorites'),
  createCollection: (data) => ipcRenderer.invoke('db:createCollection', data),
  getCollections: () => ipcRenderer.invoke('db:getCollections'),
  updateCollection: (id, data) => ipcRenderer.invoke('db:updateCollection', id, data),
  deleteCollection: (id) => ipcRenderer.invoke('db:deleteCollection', id),
  batchDeleteCollections: (ids) => ipcRenderer.invoke('db:batchDeleteCollections', ids),
  logActivity: (promptId, action) => ipcRenderer.invoke('db:logActivity', promptId, action),
  getActivity: (limit) => ipcRenderer.invoke('db:getActivity', limit),
  exportData: (format, options) => ipcRenderer.invoke('db:exportData', format, options),
  importData: (filePath) => ipcRenderer.invoke('db:importData', filePath),
  importCsv: (filePath) => ipcRenderer.invoke('db:importCsv', filePath),
  commitImport: (prompts) => ipcRenderer.invoke('db:commitImport', prompts),
  searchPrompts: (query, filter) => ipcRenderer.invoke('db:searchPrompts', query, filter),
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  getTemplates: () => ipcRenderer.invoke('db:getTemplates'),
  createTemplate: (data) => ipcRenderer.invoke('db:createTemplate', data),
  deleteTemplate: (id) => ipcRenderer.invoke('db:deleteTemplate', id),
  batchDeletePrompts: (ids) => ipcRenderer.invoke('db:batchDeletePrompts', ids),
  batchSetFavorite: (ids, favorite) => ipcRenderer.invoke('db:batchSetFavorite', ids, favorite),
  batchSetCollection: (ids, collectionId) => ipcRenderer.invoke('db:batchSetCollection', ids, collectionId),
  getDatabaseStats: () => ipcRenderer.invoke('db:getDatabaseStats'),
  getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),
  openDbFolder: () => ipcRenderer.invoke('db:openDbFolder'),
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
  setAutoStart: (enable) => ipcRenderer.invoke('app:setAutoStart', enable),
  getVersions: () => ipcRenderer.invoke('app:getVersions'),
  getUptime: () => ipcRenderer.invoke('app:getUptime'),
  getSessionCount: () => ipcRenderer.invoke('app:getSessionCount'),
  getLastBackup: () => ipcRenderer.invoke('app:getLastBackup'),
  getTotalActivity: () => ipcRenderer.invoke('app:getTotalActivity'),
  getDiskFree: () => ipcRenderer.invoke('app:getDiskFree'),
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    rename: (oldName, newName) => ipcRenderer.invoke('tags:rename', oldName, newName),
    merge: (source, target) => ipcRenderer.invoke('tags:merge', source, target),
    delete: (tagName) => ipcRenderer.invoke('tags:delete', tagName),
  },
})
