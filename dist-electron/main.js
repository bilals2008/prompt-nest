import { BrowserWindow, app, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sqlite3 from "sqlite3";
import fs from "node:fs";
//#region electron/database/schema.js
var SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  collection_id TEXT,
  favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL
);
`;
async function createTables() {
	await getDatabase().exec(SCHEMA);
}
//#endregion
//#region electron/database/db.js
var db = null;
function getDatabase() {
	if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
	return db;
}
async function initDatabase() {
	if (db) return db;
	const dbDir = path.join(app.getPath("userData"), "PromptNest");
	if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
	const dbPath = path.join(dbDir, "promptnest.db");
	await new Promise((resolve, reject) => {
		db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				console.error("[DB] Failed to open database:", err);
				reject(err);
				return;
			}
			console.log("[DB] Database opened at:", dbPath);
			resolve();
		});
	});
	await db.run("PRAGMA journal_mode = WAL");
	await db.run("PRAGMA foreign_keys = ON");
	await createTables();
	await seedData();
	console.log("[DB] Database initialized successfully");
	return db;
}
async function seedData() {
	if ((await db.get("SELECT COUNT(*) as count FROM prompts")).count > 0) return;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const insert = "INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
	await db.run(insert, [
		crypto.randomUUID(),
		"React Component Generator",
		"Create a reusable React component with PropTypes, default props, and proper state management. Include a loading state, empty state, and error boundary.",
		"react, component, frontend",
		null,
		1,
		now,
		now
	]);
	await db.run(insert, [
		crypto.randomUUID(),
		"UI Design Critique",
		"Review this UI design for consistency, accessibility, color contrast, typography hierarchy, spacing, and responsive behavior. Provide specific actionable feedback.",
		"design, ui, review",
		null,
		0,
		now,
		now
	]);
	await db.run(insert, [
		crypto.randomUUID(),
		"Marketing Email Copy",
		"Write a compelling marketing email for our new product launch. The tone should be professional yet friendly. Include subject line options, body copy, and a clear CTA.",
		"marketing, copywriting, email",
		null,
		1,
		now,
		now
	]);
}
function closeDatabase() {
	if (db) {
		db.close();
		db = null;
	}
}
//#endregion
//#region electron/database/prompts.js
async function createPrompt({ title, content, tags = "", collection_id = null }) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)", [
		id,
		title,
		content,
		tags,
		collection_id,
		now,
		now
	]);
	return getPromptById(id);
}
async function getPromptById(id) {
	return await getDatabase().get("SELECT * FROM prompts WHERE id = ?", [id]) || null;
}
async function getAllPrompts() {
	return getDatabase().all("SELECT * FROM prompts ORDER BY created_at DESC");
}
async function getFavorites() {
	return getDatabase().all("SELECT * FROM prompts WHERE favorite = 1 ORDER BY updated_at DESC");
}
async function updatePrompt(id, { title, content, tags, collection_id }) {
	const db = getDatabase();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const sets = [];
	const values = [];
	if (title !== void 0) {
		sets.push("title = ?");
		values.push(title);
	}
	if (content !== void 0) {
		sets.push("content = ?");
		values.push(content);
	}
	if (tags !== void 0) {
		sets.push("tags = ?");
		values.push(tags);
	}
	if (collection_id !== void 0) {
		sets.push("collection_id = ?");
		values.push(collection_id);
	}
	sets.push("updated_at = ?");
	values.push(now);
	values.push(id);
	await db.run(`UPDATE prompts SET ${sets.join(", ")} WHERE id = ?`, values);
	return getPromptById(id);
}
async function deletePrompt(id) {
	await getDatabase().run("DELETE FROM prompts WHERE id = ?", [id]);
	return { success: true };
}
async function toggleFavorite(id) {
	const db = getDatabase();
	const prompt = await getPromptById(id);
	if (!prompt) return null;
	const newVal = prompt.favorite ? 0 : 1;
	await db.run("UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?", [
		newVal,
		(/* @__PURE__ */ new Date()).toISOString(),
		id
	]);
	return getPromptById(id);
}
//#endregion
//#region electron/database/collections.js
async function createCollection({ name, icon = "folder" }) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)", [
		id,
		name,
		icon,
		now
	]);
	return getCollectionById(id);
}
async function getCollectionById(id) {
	return await getDatabase().get("SELECT * FROM collections WHERE id = ?", [id]) || null;
}
async function getCollections() {
	return getDatabase().all("SELECT * FROM collections ORDER BY created_at ASC");
}
async function updateCollection(id, { name, icon }) {
	await getDatabase().run("UPDATE collections SET name = ?, icon = ? WHERE id = ?", [
		name,
		icon || "folder",
		id
	]);
	return getCollectionById(id);
}
async function deleteCollection(id) {
	const db = getDatabase();
	await db.run("UPDATE prompts SET collection_id = NULL WHERE collection_id = ?", [id]);
	await db.run("DELETE FROM collections WHERE id = ?", [id]);
	return { success: true };
}
//#endregion
//#region electron/main.js
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(RENDERER_DIST, "index.html"));
}
function registerIpcHandlers() {
	ipcMain.handle("db:createPrompt", (_, data) => createPrompt(data));
	ipcMain.handle("db:getPromptById", (_, id) => getPromptById(id));
	ipcMain.handle("db:getAllPrompts", () => getAllPrompts());
	ipcMain.handle("db:updatePrompt", (_, id, data) => updatePrompt(id, data));
	ipcMain.handle("db:deletePrompt", (_, id) => deletePrompt(id));
	ipcMain.handle("db:toggleFavorite", (_, id) => toggleFavorite(id));
	ipcMain.handle("db:getFavorites", () => getFavorites());
	ipcMain.handle("db:createCollection", (_, data) => createCollection(data));
	ipcMain.handle("db:getCollections", () => getCollections());
	ipcMain.handle("db:updateCollection", (_, id, data) => updateCollection(id, data));
	ipcMain.handle("db:deleteCollection", (_, id) => deleteCollection(id));
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(async () => {
	await initDatabase();
	registerIpcHandlers();
	createWindow();
});
app.on("will-quit", () => {
	closeDatabase();
});
//#endregion
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
