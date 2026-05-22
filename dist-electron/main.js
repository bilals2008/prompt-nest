import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import { fileURLToPath as r } from "node:url";
import i from "node:path";
import a from "sqlite3";
import o from "node:fs";
//#region electron/database/schema.js
var s = "\nCREATE TABLE IF NOT EXISTS prompts (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  content TEXT NOT NULL,\n  tags TEXT,\n  collection_id TEXT,\n  favorite INTEGER DEFAULT 0,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS collections (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  icon TEXT,\n  created_at TEXT NOT NULL\n);\n";
async function c() {
	await u().exec(s);
}
//#endregion
//#region electron/database/db.js
var l = null;
function u() {
	if (!l) throw Error("Database not initialized. Call initDatabase() first.");
	return l;
}
async function d() {
	if (l) return l;
	let e = i.join(t.getPath("userData"), "PromptNest");
	o.existsSync(e) || o.mkdirSync(e, { recursive: !0 });
	let n = i.join(e, "promptnest.db");
	return await new Promise((e, t) => {
		l = new a.Database(n, (r) => {
			if (r) {
				console.error("[DB] Failed to open database:", r), t(r);
				return;
			}
			console.log("[DB] Database opened at:", n), e();
		});
	}), await l.run("PRAGMA journal_mode = WAL"), await l.run("PRAGMA foreign_keys = ON"), await c(), await f(), console.log("[DB] Database initialized successfully"), l;
}
async function f() {
	if ((await l.get("SELECT COUNT(*) as count FROM prompts")).count > 0) return;
	let e = (/* @__PURE__ */ new Date()).toISOString(), t = "INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
	await l.run(t, [
		crypto.randomUUID(),
		"React Component Generator",
		"Create a reusable React component with PropTypes, default props, and proper state management. Include a loading state, empty state, and error boundary.",
		"react, component, frontend",
		null,
		1,
		e,
		e
	]), await l.run(t, [
		crypto.randomUUID(),
		"UI Design Critique",
		"Review this UI design for consistency, accessibility, color contrast, typography hierarchy, spacing, and responsive behavior. Provide specific actionable feedback.",
		"design, ui, review",
		null,
		0,
		e,
		e
	]), await l.run(t, [
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
function p() {
	l &&= (l.close(), null);
}
//#endregion
//#region electron/database/prompts.js
async function m({ title: e, content: t, tags: n = "", collection_id: r = null }) {
	let i = u(), a = crypto.randomUUID(), o = (/* @__PURE__ */ new Date()).toISOString();
	return await i.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)", [
		a,
		e,
		t,
		n,
		r,
		o,
		o
	]), h(a);
}
async function h(e) {
	return await u().get("SELECT * FROM prompts WHERE id = ?", [e]) || null;
}
async function g() {
	return u().all("SELECT * FROM prompts ORDER BY created_at DESC");
}
async function _() {
	return u().all("SELECT * FROM prompts WHERE favorite = 1 ORDER BY updated_at DESC");
}
async function v(e, { title: t, content: n, tags: r, collection_id: i }) {
	let a = u(), o = (/* @__PURE__ */ new Date()).toISOString(), s = [], c = [];
	return t !== void 0 && (s.push("title = ?"), c.push(t)), n !== void 0 && (s.push("content = ?"), c.push(n)), r !== void 0 && (s.push("tags = ?"), c.push(r)), i !== void 0 && (s.push("collection_id = ?"), c.push(i)), s.push("updated_at = ?"), c.push(o), c.push(e), await a.run(`UPDATE prompts SET ${s.join(", ")} WHERE id = ?`, c), h(e);
}
async function y(e) {
	return await u().run("DELETE FROM prompts WHERE id = ?", [e]), { success: !0 };
}
async function b(e) {
	let t = u(), n = await h(e);
	if (!n) return null;
	let r = +!n.favorite;
	return await t.run("UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?", [
		r,
		(/* @__PURE__ */ new Date()).toISOString(),
		e
	]), h(e);
}
//#endregion
//#region electron/database/collections.js
async function x({ name: e, icon: t = "folder" }) {
	let n = u(), r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
	return await n.run("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)", [
		r,
		e,
		t,
		i
	]), S(r);
}
async function S(e) {
	return await u().get("SELECT * FROM collections WHERE id = ?", [e]) || null;
}
async function C() {
	return u().all("SELECT * FROM collections ORDER BY created_at ASC");
}
async function w(e, { name: t, icon: n }) {
	return await u().run("UPDATE collections SET name = ?, icon = ? WHERE id = ?", [
		t,
		n || "folder",
		e
	]), S(e);
}
async function T(e) {
	let t = u();
	return await t.run("UPDATE prompts SET collection_id = NULL WHERE collection_id = ?", [e]), await t.run("DELETE FROM collections WHERE id = ?", [e]), { success: !0 };
}
//#endregion
//#region electron/main.js
var E = i.dirname(r(import.meta.url));
process.env.APP_ROOT = i.join(E, "..");
var D = process.env.VITE_DEV_SERVER_URL, O = i.join(process.env.APP_ROOT, "dist-electron"), k = i.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = D ? i.join(process.env.APP_ROOT, "public") : k;
var A;
function j() {
	A = new e({
		icon: i.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: i.join(E, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), A.webContents.on("did-finish-load", () => {
		A?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), D ? A.loadURL(D) : A.loadFile(i.join(k, "index.html"));
}
function M() {
	n.handle("db:createPrompt", (e, t) => m(t)), n.handle("db:getPromptById", (e, t) => h(t)), n.handle("db:getAllPrompts", () => g()), n.handle("db:updatePrompt", (e, t, n) => v(t, n)), n.handle("db:deletePrompt", (e, t) => y(t)), n.handle("db:toggleFavorite", (e, t) => b(t)), n.handle("db:getFavorites", () => _()), n.handle("db:createCollection", (e, t) => x(t)), n.handle("db:getCollections", () => C()), n.handle("db:updateCollection", (e, t, n) => w(t, n)), n.handle("db:deleteCollection", (e, t) => T(t));
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), A = null);
}), t.on("activate", () => {
	e.getAllWindows().length === 0 && j();
}), t.whenReady().then(async () => {
	await d(), M(), j();
}), t.on("will-quit", () => {
	p();
});
//#endregion
export { O as MAIN_DIST, k as RENDERER_DIST, D as VITE_DEV_SERVER_URL };
