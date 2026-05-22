import { BrowserWindow as e, app as t, dialog as n, ipcMain as r } from "electron";
import { fileURLToPath as i } from "node:url";
import a from "node:path";
import o from "sqlite3";
import s from "node:fs";
//#region electron/database/schema.js
var c = "\nCREATE TABLE IF NOT EXISTS prompts (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  content TEXT NOT NULL,\n  tags TEXT,\n  collection_id TEXT,\n  favorite INTEGER DEFAULT 0,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS collections (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  icon TEXT,\n  created_at TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS activity_log (\n  id TEXT PRIMARY KEY,\n  prompt_id TEXT,\n  action TEXT NOT NULL,\n  created_at TEXT NOT NULL\n);\n";
async function l() {
	await d().exec(c);
}
//#endregion
//#region electron/database/db.js
var u = null;
function d() {
	if (!u) throw Error("Database not initialized. Call initDatabase() first.");
	return u;
}
async function f() {
	if (u) return u;
	let e = a.join(t.getPath("userData"), "PromptNest");
	s.existsSync(e) || s.mkdirSync(e, { recursive: !0 });
	let n = a.join(e, "promptnest.db");
	return await new Promise((e, t) => {
		u = new o.Database(n, (r) => {
			if (r) {
				console.error("[DB] Failed to open database:", r), t(r);
				return;
			}
			console.log("[DB] Database opened at:", n), e();
		});
	}), await u.run("PRAGMA journal_mode = WAL"), await u.run("PRAGMA foreign_keys = ON"), await l(), await p(), console.log("[DB] Database initialized successfully"), u;
}
async function p() {
	if ((await u.get("SELECT COUNT(*) as count FROM prompts")).count > 0) return;
	let e = (/* @__PURE__ */ new Date()).toISOString(), t = "INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
	await u.run(t, [
		crypto.randomUUID(),
		"React Component Generator",
		"Create a reusable React component with PropTypes, default props, and proper state management. Include a loading state, empty state, and error boundary.",
		"react, component, frontend",
		null,
		1,
		e,
		e
	]), await u.run(t, [
		crypto.randomUUID(),
		"UI Design Critique",
		"Review this UI design for consistency, accessibility, color contrast, typography hierarchy, spacing, and responsive behavior. Provide specific actionable feedback.",
		"design, ui, review",
		null,
		0,
		e,
		e
	]), await u.run(t, [
		crypto.randomUUID(),
		"Marketing Email Copy",
		"Write a compelling marketing email for our new product launch. The tone should be professional yet friendly. Include subject line options, body copy, and a clear CTA.",
		"marketing, copywriting, email",
		null,
		1,
		e,
		e
	]);
}
function m() {
	u &&= (u.close(), null);
}
//#endregion
//#region electron/database/prompts.js
async function h({ title: e, content: t, tags: n = "", collection_id: r = null }) {
	let i = d(), a = crypto.randomUUID(), o = (/* @__PURE__ */ new Date()).toISOString();
	return await i.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)", [
		a,
		e,
		t,
		n,
		r,
		o,
		o
	]), g(a);
}
async function g(e) {
	return await d().get("SELECT * FROM prompts WHERE id = ?", [e]) || null;
}
async function _() {
	return d().all("SELECT * FROM prompts ORDER BY created_at DESC");
}
async function v() {
	return d().all("SELECT * FROM prompts WHERE favorite = 1 ORDER BY updated_at DESC");
}
async function y(e, { title: t, content: n, tags: r, collection_id: i }) {
	let a = d(), o = (/* @__PURE__ */ new Date()).toISOString(), s = [], c = [];
	return t !== void 0 && (s.push("title = ?"), c.push(t)), n !== void 0 && (s.push("content = ?"), c.push(n)), r !== void 0 && (s.push("tags = ?"), c.push(r)), i !== void 0 && (s.push("collection_id = ?"), c.push(i)), s.push("updated_at = ?"), c.push(o), c.push(e), await a.run(`UPDATE prompts SET ${s.join(", ")} WHERE id = ?`, c), g(e);
}
async function b(e) {
	return await d().run("DELETE FROM prompts WHERE id = ?", [e]), { success: !0 };
}
async function x(e) {
	let t = d(), n = await g(e);
	if (!n) return null;
	let r = +!n.favorite;
	return await t.run("UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?", [
		r,
		(/* @__PURE__ */ new Date()).toISOString(),
		e
	]), g(e);
}
//#endregion
//#region electron/database/collections.js
async function S({ name: e, icon: t = "folder" }) {
	let n = d(), r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
	return await n.run("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)", [
		r,
		e,
		t,
		i
	]), C(r);
}
async function C(e) {
	return await d().get("SELECT * FROM collections WHERE id = ?", [e]) || null;
}
async function w() {
	return d().all("SELECT * FROM collections ORDER BY created_at ASC");
}
async function T(e, { name: t, icon: n }) {
	return await d().run("UPDATE collections SET name = ?, icon = ? WHERE id = ?", [
		t,
		n || "folder",
		e
	]), C(e);
}
async function E(e) {
	let t = d();
	return await t.run("UPDATE prompts SET collection_id = NULL WHERE collection_id = ?", [e]), await t.run("DELETE FROM collections WHERE id = ?", [e]), { success: !0 };
}
//#endregion
//#region electron/database/activity.js
async function D(e, t) {
	let n = d(), r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
	return await n.run("INSERT INTO activity_log (id, prompt_id, action, created_at) VALUES (?, ?, ?, ?)", [
		r,
		e,
		t,
		i
	]), r;
}
async function O(e = 50) {
	return await d().all("\n    SELECT a.*, p.title as prompt_title, p.content as prompt_content\n    FROM activity_log a\n    LEFT JOIN prompts p ON a.prompt_id = p.id\n    ORDER BY a.created_at DESC\n    LIMIT ?\n  ", [e]) || [];
}
//#endregion
//#region electron/database/io.js
async function k(t) {
	let r = d(), i = await r.all("SELECT * FROM prompts ORDER BY created_at DESC"), a = await r.all("SELECT * FROM collections ORDER BY created_at ASC"), o, c;
	switch (t) {
		case "json":
			o = JSON.stringify({
				prompts: i,
				collections: a,
				exportedAt: (/* @__PURE__ */ new Date()).toISOString()
			}, null, 2), c = [{
				name: "JSON",
				extensions: ["json"]
			}];
			break;
		case "markdown": {
			let e = "# Prompt Nest Export\n\n";
			e += `Exported: ${(/* @__PURE__ */ new Date()).toLocaleString()}\n\n---\n\n`;
			for (let t of i) e += `## ${t.title}\n\n`, t.tags && (e += `**Tags:** ${t.tags}\n\n`), e += `${t.content}\n\n`, e += `_Created: ${new Date(t.created_at).toLocaleString()} | Updated: ${new Date(t.updated_at).toLocaleString()}_\n\n---\n\n`;
			o = e, c = [{
				name: "Markdown",
				extensions: ["md"]
			}];
			break;
		}
		case "txt": {
			let e = "";
			for (let t of i) e += `${"=".repeat(60)}\n`, e += `TITLE: ${t.title}\n`, t.tags && (e += `TAGS: ${t.tags}\n`), e += `${"=".repeat(60)}\n`, e += `${t.content}\n\n`;
			o = e, c = [{
				name: "Text",
				extensions: ["txt"]
			}];
			break;
		}
		default: throw Error(`Unsupported format: ${t}`);
	}
	let l = e.getFocusedWindow(), { canceled: u, filePath: f } = await n.showSaveDialog(l, {
		title: `Export as ${t.toUpperCase()}`,
		defaultPath: `promptnest-export.${t === "markdown" ? "md" : t}`,
		filters: c
	});
	return u || !f ? { canceled: !0 } : (s.writeFileSync(f, o, "utf-8"), {
		success: !0,
		filePath: f
	});
}
async function A() {
	let t = d(), r = e.getFocusedWindow(), { canceled: i, filePaths: a } = await n.showOpenDialog(r, {
		title: "Import Prompts",
		properties: ["openFile"],
		filters: [{
			name: "JSON Backup",
			extensions: ["json"]
		}]
	});
	if (i || a.length === 0) return { canceled: !0 };
	let o = s.readFileSync(a[0], "utf-8"), c;
	try {
		c = JSON.parse(o);
	} catch {
		return { error: "Invalid JSON file" };
	}
	let l = {
		prompts: 0,
		collections: 0,
		errors: 0
	};
	if (Array.isArray(c.collections)) {
		let e = await t.all("SELECT id FROM collections"), n = new Set(e.map((e) => e.id));
		for (let e of c.collections) try {
			n.has(e.id) ? await t.run("UPDATE collections SET name = ?, icon = ? WHERE id = ?", [
				e.name,
				e.icon || "folder",
				e.id
			]) : await t.run("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)", [
				e.id || crypto.randomUUID(),
				e.name,
				e.icon || "folder",
				e.created_at || (/* @__PURE__ */ new Date()).toISOString()
			]), l.collections++;
		} catch {
			l.errors++;
		}
	}
	if (Array.isArray(c.prompts)) for (let e of c.prompts) try {
		await t.get("SELECT id FROM prompts WHERE id = ?", [e.id]) ? await t.run("UPDATE prompts SET title = ?, content = ?, tags = ?, collection_id = ?, favorite = ?, updated_at = ? WHERE id = ?", [
			e.title,
			e.content,
			e.tags || "",
			e.collection_id || null,
			e.favorite || 0,
			(/* @__PURE__ */ new Date()).toISOString(),
			e.id
		]) : await t.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
			e.id || crypto.randomUUID(),
			e.title,
			e.content,
			e.tags || "",
			e.collection_id || null,
			e.favorite || 0,
			e.created_at || (/* @__PURE__ */ new Date()).toISOString(),
			(/* @__PURE__ */ new Date()).toISOString()
		]), l.prompts++;
	} catch {
		l.errors++;
	}
	return {
		success: !0,
		...l
	};
}
//#endregion
//#region electron/main.js
var j = a.dirname(i(import.meta.url));
process.env.APP_ROOT = a.join(j, "..");
var M = process.env.VITE_DEV_SERVER_URL, N = a.join(process.env.APP_ROOT, "dist-electron"), P = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = M ? a.join(process.env.APP_ROOT, "public") : P;
var F;
function I() {
	F = new e({
		icon: a.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: a.join(j, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), F.webContents.on("did-finish-load", () => {
		F?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), M ? F.loadURL(M) : F.loadFile(a.join(P, "index.html"));
}
function L() {
	r.handle("db:createPrompt", (e, t) => h(t)), r.handle("db:getPromptById", (e, t) => g(t)), r.handle("db:getAllPrompts", () => _()), r.handle("db:updatePrompt", (e, t, n) => y(t, n)), r.handle("db:deletePrompt", (e, t) => b(t)), r.handle("db:toggleFavorite", (e, t) => x(t)), r.handle("db:getFavorites", () => v()), r.handle("db:createCollection", (e, t) => S(t)), r.handle("db:getCollections", () => w()), r.handle("db:updateCollection", (e, t, n) => T(t, n)), r.handle("db:deleteCollection", (e, t) => E(t)), r.handle("db:logActivity", (e, t, n) => D(t, n)), r.handle("db:getActivity", (e, t) => O(t)), r.handle("db:exportData", (e, t) => k(t)), r.handle("db:importData", () => A());
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), F = null);
}), t.on("activate", () => {
	e.getAllWindows().length === 0 && I();
}), t.whenReady().then(async () => {
	await f(), L(), I();
}), t.on("will-quit", () => {
	m();
});
//#endregion
export { N as MAIN_DIST, P as RENDERER_DIST, M as VITE_DEV_SERVER_URL };
