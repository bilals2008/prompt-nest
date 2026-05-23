let electron = require("electron");
//#region electron/preload.js
electron.contextBridge.exposeInMainWorld("electronAPI", {
	onUpdaterEvent: (listener) => {
		const handler = (_event, data) => listener(data);
		electron.ipcRenderer.on("updater:event", handler);
		return () => electron.ipcRenderer.removeListener("updater:event", handler);
	},
	updater: {
		getAppVersion: () => electron.ipcRenderer.invoke("updater:get-app-version"),
		checkForUpdates: () => electron.ipcRenderer.invoke("updater:check-for-updates"),
		downloadUpdate: () => electron.ipcRenderer.invoke("updater:download-update"),
		quitAndInstall: () => electron.ipcRenderer.invoke("updater:quit-and-install"),
		pauseDownload: () => electron.ipcRenderer.invoke("updater:pause-download"),
		resumeDownload: () => electron.ipcRenderer.invoke("updater:resume-download")
	}
});
electron.contextBridge.exposeInMainWorld("db", {
	createPrompt: (data) => electron.ipcRenderer.invoke("db:createPrompt", data),
	getPromptById: (id) => electron.ipcRenderer.invoke("db:getPromptById", id),
	getAllPrompts: () => electron.ipcRenderer.invoke("db:getAllPrompts"),
	updatePrompt: (id, data) => electron.ipcRenderer.invoke("db:updatePrompt", id, data),
	deletePrompt: (id) => electron.ipcRenderer.invoke("db:deletePrompt", id),
	toggleFavorite: (id) => electron.ipcRenderer.invoke("db:toggleFavorite", id),
	getFavorites: () => electron.ipcRenderer.invoke("db:getFavorites"),
	createCollection: (data) => electron.ipcRenderer.invoke("db:createCollection", data),
	getCollections: () => electron.ipcRenderer.invoke("db:getCollections"),
	updateCollection: (id, data) => electron.ipcRenderer.invoke("db:updateCollection", id, data),
	deleteCollection: (id) => electron.ipcRenderer.invoke("db:deleteCollection", id),
	logActivity: (promptId, action) => electron.ipcRenderer.invoke("db:logActivity", promptId, action),
	getActivity: (limit) => electron.ipcRenderer.invoke("db:getActivity", limit),
	exportData: (format) => electron.ipcRenderer.invoke("db:exportData", format),
	importData: () => electron.ipcRenderer.invoke("db:importData"),
	searchPrompts: (query, filter) => electron.ipcRenderer.invoke("db:searchPrompts", query, filter),
	getDashboardStats: () => electron.ipcRenderer.invoke("db:getDashboardStats"),
	getTemplates: () => electron.ipcRenderer.invoke("db:getTemplates"),
	createTemplate: (data) => electron.ipcRenderer.invoke("db:createTemplate", data),
	deleteTemplate: (id) => electron.ipcRenderer.invoke("db:deleteTemplate", id),
	getDatabaseStats: () => electron.ipcRenderer.invoke("db:getDatabaseStats"),
	openDbFolder: () => electron.ipcRenderer.invoke("db:openDbFolder"),
	backupDatabase: () => electron.ipcRenderer.invoke("db:backupDatabase"),
	getAppVersion: () => electron.ipcRenderer.invoke("app:getVersion")
});
//#endregion
