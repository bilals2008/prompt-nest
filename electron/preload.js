import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('db', {
  createPrompt: (data) => ipcRenderer.invoke('db:createPrompt', data),
  getPromptById: (id) => ipcRenderer.invoke('db:getPromptById', id),
  getAllPrompts: () => ipcRenderer.invoke('db:getAllPrompts'),
  updatePrompt: (id, data) => ipcRenderer.invoke('db:updatePrompt', id, data),
  deletePrompt: (id) => ipcRenderer.invoke('db:deletePrompt', id),
  toggleFavorite: (id) => ipcRenderer.invoke('db:toggleFavorite', id),
  createCollection: (data) => ipcRenderer.invoke('db:createCollection', data),
  getCollections: () => ipcRenderer.invoke('db:getCollections'),
  deleteCollection: (id) => ipcRenderer.invoke('db:deleteCollection', id),
})
