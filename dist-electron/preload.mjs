let electron = require("electron");
//#region electron/preload.js
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
	on(channel, listener) {
		return electron.ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
	},
	off(channel, ...omit) {
		return electron.ipcRenderer.off(channel, ...omit);
	},
	send(channel, ...omit) {
		return electron.ipcRenderer.send(channel, ...omit);
	},
	invoke(channel, ...omit) {
		return electron.ipcRenderer.invoke(channel, ...omit);
	}
});
//#endregion
