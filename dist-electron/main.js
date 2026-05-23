import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import pkg from "electron-updater";
import sqlite3 from "sqlite3";
//#region electron/database/schema.js
var SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  notes TEXT,
  collection_id TEXT,
  favorite INTEGER DEFAULT 0,
  is_template INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  prompt_id TEXT,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;
async function createTables() {
	const db = getDatabase();
	await db.exec(SCHEMA);
	const columns = await db.all("PRAGMA table_info(prompts)");
	if (!columns.some((c) => c.name === "is_template")) await db.run("ALTER TABLE prompts ADD COLUMN is_template INTEGER DEFAULT 0");
	if (!columns.some((c) => c.name === "notes")) await db.run("ALTER TABLE prompts ADD COLUMN notes TEXT");
	if (!(await db.all("PRAGMA table_info(collections)")).some((c) => c.name === "color")) await db.run("ALTER TABLE collections ADD COLUMN color TEXT DEFAULT 'blue'");
}
//#endregion
//#region electron/database/db.js
var db = null;
function wrap(db) {
	return {
		run(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.run(sql, params, function(err) {
					if (err) reject(err);
					else resolve(this);
				});
			});
		},
		get(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.get(sql, params, (err, row) => {
					if (err) reject(err);
					else resolve(row);
				});
			});
		},
		all(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.all(sql, params, (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});
		},
		exec(sql) {
			return new Promise((resolve, reject) => {
				db.exec(sql, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}
	};
}
function getDatabase() {
	if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
	return db;
}
async function initDatabase() {
	if (db) return db;
	const dbDir = path.join(app.getPath("userData"), "PromptNest");
	if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
	const dbPath = path.join(dbDir, "promptnest.db");
	db = wrap(await new Promise((resolve, reject) => {
		const d = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(d);
		});
	}));
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
	const tplInsert = "INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)";
	await db.run(tplInsert, [
		crypto.randomUUID(),
		"Code Review Checklist",
		"Review this code for:\n- Correctness: Does it handle edge cases?\n- Performance: Any obvious bottlenecks?\n- Readability: Is the intent clear?\n- Security: Any injection or validation issues?\n- Testing: Are there unit tests?",
		"code, review, checklist",
		now,
		now
	]);
	await db.run(tplInsert, [
		crypto.randomUUID(),
		"Meeting Notes",
		"## Agenda\n- \n- \n\n## Discussion Points\n1. \n2. \n3. \n\n## Action Items\n- [ ] \n- [ ] \n\n## Decisions\n- ",
		"meetings, productivity",
		now,
		now
	]);
	await db.run(tplInsert, [
		crypto.randomUUID(),
		"Brainstorming Session",
		"## Problem Statement\n\n## Ideas\n- \n- \n- \n\n## Constraints\n- \n- \n\n## Next Steps\n1. \n2. ",
		"creative, brainstorming",
		now,
		now
	]);
}
function closeDatabase() {
	if (db) db.run("PRAGMA optimize");
	db = null;
}
async function getDashboardStats() {
	const d = getDatabase();
	const totalPrompts = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0");
	const collections = await d.get("SELECT COUNT(*) as count FROM collections");
	const totalTemplates = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 1");
	const thisWeek = await d.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0 AND created_at >= datetime('now', '-7 days')");
	return {
		totalPrompts: totalPrompts?.count || 0,
		collections: collections?.count || 0,
		totalTemplates: totalTemplates?.count || 0,
		thisWeek: thisWeek?.count || 0
	};
}
async function getDatabaseStats() {
	const d = getDatabase();
	const promptCount = await d.get("SELECT COUNT(*) as count FROM prompts");
	const collectionCount = await d.get("SELECT COUNT(*) as count FROM collections");
	const favoriteCount = await d.get("SELECT COUNT(*) as count FROM prompts WHERE favorite = 1");
	const dbPath = path.join(app.getPath("userData"), "PromptNest", "promptnest.db");
	let size = 0;
	try {
		size = fs.statSync(dbPath).size;
	} catch {}
	return {
		prompts: promptCount?.count || 0,
		collections: collectionCount?.count || 0,
		favorites: favoriteCount?.count || 0,
		size,
		path: dbPath
	};
}
//#endregion
//#region electron/database/prompts.js
async function createPrompt({ title, content, tags = "", notes = "", collection_id = null }) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO prompts (id, title, content, tags, notes, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)", [
		id,
		title,
		content,
		tags,
		notes,
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
	return getDatabase().all(`
    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color
    FROM prompts p
    LEFT JOIN collections c ON p.collection_id = c.id
    ORDER BY p.created_at DESC
  `);
}
async function getFavorites() {
	return getDatabase().all(`
    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color
    FROM prompts p
    LEFT JOIN collections c ON p.collection_id = c.id
    WHERE p.favorite = 1 ORDER BY p.updated_at DESC
  `);
}
async function updatePrompt(id, { title, content, tags, notes, collection_id }) {
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
	if (notes !== void 0) {
		sets.push("notes = ?");
		values.push(notes);
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
async function getTemplates() {
	return getDatabase().all("SELECT * FROM prompts WHERE is_template = 1 ORDER BY updated_at DESC");
}
async function createTemplate({ title, content, tags = "" }) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)", [
		id,
		title,
		content,
		tags,
		now,
		now
	]);
	return getPromptById(id);
}
async function deleteTemplate(id) {
	await getDatabase().run("DELETE FROM prompts WHERE id = ? AND is_template = 1", [id]);
	return { success: true };
}
async function searchPrompts(query, filter = "all") {
	const db = getDatabase();
	const q = `%${query}%`;
	let sql = `
    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color
    FROM prompts p
    LEFT JOIN collections c ON p.collection_id = c.id
    WHERE p.is_template = 0 AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ? OR c.name LIKE ?)
  `;
	if (filter === "favorites") sql += " AND p.favorite = 1";
	if (filter === "recent") sql += " AND p.updated_at >= datetime('now', '-7 days')";
	sql += " ORDER BY p.updated_at DESC LIMIT 100";
	return db.all(sql, [
		q,
		q,
		q,
		q
	]);
}
//#endregion
//#region electron/database/collections.js
async function createCollection({ name, icon = "folder", color = "blue" }) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO collections (id, name, icon, color, created_at) VALUES (?, ?, ?, ?, ?)", [
		id,
		name,
		icon,
		color,
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
async function updateCollection(id, { name, icon, color }) {
	await getDatabase().run("UPDATE collections SET name = ?, icon = ?, color = ? WHERE id = ?", [
		name,
		icon || "folder",
		color || "blue",
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
//#region electron/database/activity.js
async function logActivity(promptId, action) {
	const db = getDatabase();
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await db.run("INSERT INTO activity_log (id, prompt_id, action, created_at) VALUES (?, ?, ?, ?)", [
		id,
		promptId,
		action,
		now
	]);
	return id;
}
async function getActivity(limit = 50) {
	return await getDatabase().all(`
    SELECT a.*, p.title as prompt_title, p.content as prompt_content
    FROM activity_log a
    LEFT JOIN prompts p ON a.prompt_id = p.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `, [limit]) || [];
}
//#endregion
//#region electron/database/io.js
async function exportData(format) {
	const db = getDatabase();
	const prompts = await db.all("SELECT * FROM prompts ORDER BY created_at DESC");
	const collections = await db.all("SELECT * FROM collections ORDER BY created_at ASC");
	let content, filters;
	switch (format) {
		case "json":
			content = JSON.stringify({
				prompts,
				collections,
				exportedAt: (/* @__PURE__ */ new Date()).toISOString()
			}, null, 2);
			filters = [{
				name: "JSON",
				extensions: ["json"]
			}];
			break;
		case "markdown": {
			let md = "# Prompt Nest Export\n\n";
			md += `Exported: ${(/* @__PURE__ */ new Date()).toLocaleString()}\n\n---\n\n`;
			for (const p of prompts) {
				md += `## ${p.title}\n\n`;
				if (p.tags) md += `**Tags:** ${p.tags}\n\n`;
				md += `${p.content}\n\n`;
				md += `_Created: ${new Date(p.created_at).toLocaleString()} | Updated: ${new Date(p.updated_at).toLocaleString()}_\n\n---\n\n`;
			}
			content = md;
			filters = [{
				name: "Markdown",
				extensions: ["md"]
			}];
			break;
		}
		case "txt": {
			let txt = "";
			for (const p of prompts) {
				txt += `${"=".repeat(60)}\n`;
				txt += `TITLE: ${p.title}\n`;
				if (p.tags) txt += `TAGS: ${p.tags}\n`;
				txt += `${"=".repeat(60)}\n`;
				txt += `${p.content}\n\n`;
			}
			content = txt;
			filters = [{
				name: "Text",
				extensions: ["txt"]
			}];
			break;
		}
		default: throw new Error(`Unsupported format: ${format}`);
	}
	const win = BrowserWindow.getFocusedWindow();
	const { canceled, filePath } = await dialog.showSaveDialog(win, {
		title: `Export as ${format.toUpperCase()}`,
		defaultPath: `promptnest-export.${format === "markdown" ? "md" : format}`,
		filters
	});
	if (canceled || !filePath) return { canceled: true };
	fs.writeFileSync(filePath, content, "utf-8");
	return {
		success: true,
		filePath
	};
}
async function importData() {
	const db = getDatabase();
	const win = BrowserWindow.getFocusedWindow();
	const { canceled, filePaths } = await dialog.showOpenDialog(win, {
		title: "Import Prompts",
		properties: ["openFile"],
		filters: [{
			name: "JSON Backup",
			extensions: ["json"]
		}]
	});
	if (canceled || filePaths.length === 0) return { canceled: true };
	const raw = fs.readFileSync(filePaths[0], "utf-8");
	let data;
	try {
		data = JSON.parse(raw);
	} catch {
		return { error: "Invalid JSON file" };
	}
	const imported = {
		prompts: 0,
		collections: 0,
		errors: 0
	};
	if (Array.isArray(data.collections)) {
		const existing = await db.all("SELECT id FROM collections");
		const existingIds = new Set(existing.map((c) => c.id));
		for (const col of data.collections) try {
			if (existingIds.has(col.id)) await db.run("UPDATE collections SET name = ?, icon = ? WHERE id = ?", [
				col.name,
				col.icon || "folder",
				col.id
			]);
			else await db.run("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)", [
				col.id || crypto.randomUUID(),
				col.name,
				col.icon || "folder",
				col.created_at || (/* @__PURE__ */ new Date()).toISOString()
			]);
			imported.collections++;
		} catch {
			imported.errors++;
		}
	}
	if (Array.isArray(data.prompts)) for (const p of data.prompts) try {
		if (await db.get("SELECT id FROM prompts WHERE id = ?", [p.id])) await db.run("UPDATE prompts SET title = ?, content = ?, tags = ?, collection_id = ?, favorite = ?, is_template = ?, updated_at = ? WHERE id = ?", [
			p.title,
			p.content,
			p.tags || "",
			p.collection_id || null,
			p.favorite || 0,
			p.is_template || 0,
			(/* @__PURE__ */ new Date()).toISOString(),
			p.id
		]);
		else await db.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
			p.id || crypto.randomUUID(),
			p.title,
			p.content,
			p.tags || "",
			p.collection_id || null,
			p.favorite || 0,
			p.is_template || 0,
			p.created_at || (/* @__PURE__ */ new Date()).toISOString(),
			(/* @__PURE__ */ new Date()).toISOString()
		]);
		imported.prompts++;
	} catch {
		imported.errors++;
	}
	return {
		success: true,
		...imported
	};
}
//#endregion
//#region electron/main.js
var { autoUpdater } = pkg;
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
var isDev = !app.isPackaged;
function sendUpdaterEvent(type, payload = {}) {
	if (!win || win.isDestroyed()) return;
	win.webContents.send("updater:event", {
		type,
		payload
	});
}
function setupUpdater() {
	autoUpdater.autoDownload = false;
	autoUpdater.autoInstallOnAppQuit = true;
	autoUpdater.on("checking-for-update", () => {
		sendUpdaterEvent("checking-for-update");
	});
	autoUpdater.on("update-available", (info) => {
		sendUpdaterEvent("update-available", {
			version: info?.version ?? "",
			releaseDate: info?.releaseDate ?? "",
			releaseNotes: info?.releaseNotes ?? ""
		});
	});
	autoUpdater.on("update-not-available", () => {
		sendUpdaterEvent("update-not-available");
	});
	autoUpdater.on("download-progress", (progress) => {
		sendUpdaterEvent("download-progress", {
			percent: progress?.percent ?? 0,
			total: progress?.total ?? 0,
			transferred: progress?.transferred ?? 0,
			bytesPerSecond: progress?.bytesPerSecond ?? 0
		});
	});
	autoUpdater.on("update-downloaded", (info) => {
		sendUpdaterEvent("update-downloaded", { version: info?.version ?? "" });
	});
	autoUpdater.on("error", (error) => {
		sendUpdaterEvent("error", { message: error?.message || "Auto update failed." });
	});
}
function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
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
	if (!isDev) setupUpdater();
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
	ipcMain.handle("db:logActivity", (_, promptId, action) => logActivity(promptId, action));
	ipcMain.handle("db:getActivity", (_, limit) => getActivity(limit));
	ipcMain.handle("db:exportData", (_, format) => exportData(format));
	ipcMain.handle("db:importData", () => importData());
	ipcMain.handle("db:searchPrompts", (_, query, filter) => searchPrompts(query, filter));
	ipcMain.handle("db:getDashboardStats", () => getDashboardStats());
	ipcMain.handle("db:getTemplates", () => getTemplates());
	ipcMain.handle("db:createTemplate", (_, data) => createTemplate(data));
	ipcMain.handle("db:deleteTemplate", (_, id) => deleteTemplate(id));
	ipcMain.handle("db:getDatabaseStats", () => getDatabaseStats());
	ipcMain.handle("app:getVersion", () => app.getVersion());
	ipcMain.handle("updater:get-app-version", () => {
		if (isDev) try {
			const pkgPath = path.join(__dirname, "..", "package.json");
			const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
			if (pkg?.version) return pkg.version;
		} catch {}
		return app.getVersion();
	});
	ipcMain.handle("updater:check-for-updates", async () => {
		if (isDev) {
			sendUpdaterEvent("update-not-available");
			return {
				ok: false,
				devMode: true
			};
		}
		try {
			await autoUpdater.checkForUpdates();
			return { ok: true };
		} catch (error) {
			sendUpdaterEvent("error", { message: error?.message });
			return {
				ok: false,
				message: error?.message
			};
		}
	});
	ipcMain.handle("updater:download-update", async () => {
		if (isDev) return {
			ok: false,
			devMode: true,
			message: "Packaged builds only."
		};
		try {
			await autoUpdater.downloadUpdate();
			return { ok: true };
		} catch (error) {
			return {
				ok: false,
				message: error?.message
			};
		}
	});
	ipcMain.handle("updater:quit-and-install", () => {
		if (isDev) return {
			ok: false,
			devMode: true,
			message: "Packaged builds only."
		};
		setImmediate(() => autoUpdater.quitAndInstall(false, true));
		return { ok: true };
	});
	ipcMain.handle("updater:pause-download", () => {
		try {
			autoUpdater.pauseDownload();
			return { ok: true };
		} catch (e) {
			return {
				ok: false,
				message: e.message
			};
		}
	});
	ipcMain.handle("updater:resume-download", () => {
		try {
			autoUpdater.resumeDownload();
			return { ok: true };
		} catch (e) {
			return {
				ok: false,
				message: e.message
			};
		}
	});
	ipcMain.handle("db:openDbFolder", async () => {
		const dbDir = path.join(app.getPath("userData"), "PromptNest");
		await shell.openPath(dbDir);
	});
	ipcMain.handle("db:backupDatabase", async () => {
		const dbDir = path.join(app.getPath("userData"), "PromptNest");
		const dbPath = path.join(dbDir, "promptnest.db");
		const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
		const backupPath = path.join(dbDir, `promptnest-backup-${timestamp}.db`);
		fs.copyFileSync(dbPath, backupPath);
		return {
			success: true,
			path: backupPath
		};
	});
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
