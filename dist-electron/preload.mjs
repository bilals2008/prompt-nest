let electron = require("electron");
//#region electron/preload.js
electron.contextBridge.exposeInMainWorld("db", {
	createPrompt: (data) => electron.ipcRenderer.invoke("db:createPrompt", data),
	getPromptById: (id) => electron.ipcRenderer.invoke("db:getPromptById", id),
	getAllPrompts: () => electron.ipcRenderer.invoke("db:getAllPrompts"),
	updatePrompt: (id, data) => electron.ipcRenderer.invoke("db:updatePrompt", id, data),
	deletePrompt: (id) => electron.ipcRenderer.invoke("db:deletePrompt", id),
	toggleFavorite: (id) => electron.ipcRenderer.invoke("db:toggleFavorite", id),
	createCollection: (data) => electron.ipcRenderer.invoke("db:createCollection", data),
	getCollections: () => electron.ipcRenderer.invoke("db:getCollections"),
	deleteCollection: (id) => electron.ipcRenderer.invoke("db:deleteCollection", id)
});
//#endregion
