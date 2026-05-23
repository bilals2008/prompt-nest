import { BrowserWindow as e, app as t, dialog as n, ipcMain as r, shell as i } from "electron";
import { fileURLToPath as a } from "node:url";
import o from "node:path";
import s from "node:fs";
import c from "electron-updater";
import l from "sqlite3";
//#region electron/database/schema.js
var u = "\nCREATE TABLE IF NOT EXISTS prompts (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  content TEXT NOT NULL,\n  tags TEXT,\n  notes TEXT,\n  collection_id TEXT,\n  favorite INTEGER DEFAULT 0,\n  is_template INTEGER DEFAULT 0,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS collections (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  icon TEXT,\n  created_at TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS activity_log (\n  id TEXT PRIMARY KEY,\n  prompt_id TEXT,\n  action TEXT NOT NULL,\n  created_at TEXT NOT NULL\n);\n";
async function d() {
	let e = m();
	await e.exec(u);
	let t = await e.all("PRAGMA table_info(prompts)");
	t.some((e) => e.name === "is_template") || await e.run("ALTER TABLE prompts ADD COLUMN is_template INTEGER DEFAULT 0"), t.some((e) => e.name === "notes") || await e.run("ALTER TABLE prompts ADD COLUMN notes TEXT"), (await e.all("PRAGMA table_info(collections)")).some((e) => e.name === "color") || await e.run("ALTER TABLE collections ADD COLUMN color TEXT DEFAULT 'blue'");
}
//#endregion
//#region electron/database/db.js
var f = null;
function p(e) {
	return {
		run(t, n = []) {
			return new Promise((r, i) => {
				e.run(t, n, function(e) {
					e ? i(e) : r(this);
				});
			});
		},
		get(t, n = []) {
			return new Promise((r, i) => {
				e.get(t, n, (e, t) => {
					e ? i(e) : r(t);
				});
			});
		},
		all(t, n = []) {
			return new Promise((r, i) => {
				e.all(t, n, (e, t) => {
					e ? i(e) : r(t);
				});
			});
		},
		exec(t) {
			return new Promise((n, r) => {
				e.exec(t, (e) => {
					e ? r(e) : n();
				});
			});
		}
	};
}
function m() {
	if (!f) throw Error("Database not initialized. Call initDatabase() first.");
	return f;
}
async function h() {
	if (f) return f;
	let e = o.join(t.getPath("userData"), "PromptNest");
	s.existsSync(e) || s.mkdirSync(e, { recursive: !0 });
	let n = o.join(e, "promptnest.db");
	return f = p(await new Promise((e, t) => {
		let r = new l.Database(n, (n) => {
			if (n) {
				t(n);
				return;
			}
			e(r);
		});
	})), await f.run("PRAGMA journal_mode = WAL"), await f.run("PRAGMA foreign_keys = ON"), await d(), await g(), console.log("[DB] Database initialized successfully"), f;
}
async function g() {
	if ((await f.get("SELECT COUNT(*) as count FROM prompts")).count > 0) return;
	let e = (/* @__PURE__ */ new Date()).toISOString(), t = "INSERT INTO prompts (id, title, content, tags, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
	await f.run(t, [
		crypto.randomUUID(),
		"React Component Generator",
		"Create a reusable React component with PropTypes, default props, and proper state management. Include a loading state, empty state, and error boundary.",
		"react, component, frontend",
		null,
		1,
		e,
		e
	]), await f.run(t, [
		crypto.randomUUID(),
		"UI Design Critique",
		"Review this UI design for consistency, accessibility, color contrast, typography hierarchy, spacing, and responsive behavior. Provide specific actionable feedback.",
		"design, ui, review",
		null,
		0,
		e,
		e
	]), await f.run(t, [
		crypto.randomUUID(),
		"Marketing Email Copy",
		"Write a compelling marketing email for our new product launch. The tone should be professional yet friendly. Include subject line options, body copy, and a clear CTA.",
		"marketing, copywriting, email",
		null,
		1,
		e,
		e
	]);
	let n = "INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)";
	await f.run(n, [
		crypto.randomUUID(),
		"Code Review Checklist",
		"Review this code for:\n- Correctness: Does it handle edge cases?\n- Performance: Any obvious bottlenecks?\n- Readability: Is the intent clear?\n- Security: Any injection or validation issues?\n- Testing: Are there unit tests?",
		"code, review, checklist",
		e,
		e
	]), await f.run(n, [
		crypto.randomUUID(),
		"Meeting Notes",
		"## Agenda\n- \n- \n\n## Discussion Points\n1. \n2. \n3. \n\n## Action Items\n- [ ] \n- [ ] \n\n## Decisions\n- ",
		"meetings, productivity",
		e,
		e
	]), await f.run(n, [
		crypto.randomUUID(),
		"Brainstorming Session",
		"## Problem Statement\n\n## Ideas\n- \n- \n- \n\n## Constraints\n- \n- \n\n## Next Steps\n1. \n2. ",
		"creative, brainstorming",
		e,
		e
	]);
}
function _() {
	f && f.run("PRAGMA optimize"), f = null;
}
async function v() {
	let e = m(), t = await e.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0"), n = await e.get("SELECT COUNT(*) as count FROM collections"), r = await e.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 1"), i = await e.get("SELECT COUNT(*) as count FROM prompts WHERE is_template = 0 AND created_at >= datetime('now', '-7 days')");
	return {
		totalPrompts: t?.count || 0,
		collections: n?.count || 0,
		totalTemplates: r?.count || 0,
		thisWeek: i?.count || 0
	};
}
async function y() {
	let e = m(), n = await e.get("SELECT COUNT(*) as count FROM prompts"), r = await e.get("SELECT COUNT(*) as count FROM collections"), i = await e.get("SELECT COUNT(*) as count FROM prompts WHERE favorite = 1"), a = o.join(t.getPath("userData"), "PromptNest", "promptnest.db"), c = 0;
	try {
		c = s.statSync(a).size;
	} catch {}
	return {
		prompts: n?.count || 0,
		collections: r?.count || 0,
		favorites: i?.count || 0,
		size: c,
		path: a
	};
}
//#endregion
//#region electron/database/prompts.js
async function b({ title: e, content: t, tags: n = "", notes: r = "", collection_id: i = null }) {
	let a = m(), o = crypto.randomUUID(), s = (/* @__PURE__ */ new Date()).toISOString();
	return await a.run("INSERT INTO prompts (id, title, content, tags, notes, collection_id, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)", [
		o,
		e,
		t,
		n,
		r,
		i,
		s,
		s
	]), x(o);
}
async function x(e) {
	return await m().get("SELECT * FROM prompts WHERE id = ?", [e]) || null;
}
async function S() {
	return m().all("\n    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color\n    FROM prompts p\n    LEFT JOIN collections c ON p.collection_id = c.id\n    ORDER BY p.created_at DESC\n  ");
}
async function C() {
	return m().all("\n    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color\n    FROM prompts p\n    LEFT JOIN collections c ON p.collection_id = c.id\n    WHERE p.favorite = 1 ORDER BY p.updated_at DESC\n  ");
}
async function w(e, { title: t, content: n, tags: r, notes: i, collection_id: a }) {
	let o = m(), s = (/* @__PURE__ */ new Date()).toISOString(), c = [], l = [];
	return t !== void 0 && (c.push("title = ?"), l.push(t)), n !== void 0 && (c.push("content = ?"), l.push(n)), r !== void 0 && (c.push("tags = ?"), l.push(r)), i !== void 0 && (c.push("notes = ?"), l.push(i)), a !== void 0 && (c.push("collection_id = ?"), l.push(a)), c.push("updated_at = ?"), l.push(s), l.push(e), await o.run(`UPDATE prompts SET ${c.join(", ")} WHERE id = ?`, l), x(e);
}
async function T(e) {
	return await m().run("DELETE FROM prompts WHERE id = ?", [e]), { success: !0 };
}
async function E(e) {
	let t = m(), n = await x(e);
	if (!n) return null;
	let r = +!n.favorite;
	return await t.run("UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?", [
		r,
		(/* @__PURE__ */ new Date()).toISOString(),
		e
	]), x(e);
}
async function D() {
	return m().all("SELECT * FROM prompts WHERE is_template = 1 ORDER BY updated_at DESC");
}
async function O({ title: e, content: t, tags: n = "" }) {
	let r = m(), i = crypto.randomUUID(), a = (/* @__PURE__ */ new Date()).toISOString();
	return await r.run("INSERT INTO prompts (id, title, content, tags, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)", [
		i,
		e,
		t,
		n,
		a,
		a
	]), x(i);
}
async function k(e) {
	return await m().run("DELETE FROM prompts WHERE id = ? AND is_template = 1", [e]), { success: !0 };
}
async function A(e, t = "all") {
	let n = m(), r = `%${e}%`, i = "\n    SELECT p.*, c.name as collection_name, c.icon as collection_icon, c.color as collection_color\n    FROM prompts p\n    LEFT JOIN collections c ON p.collection_id = c.id\n    WHERE p.is_template = 0 AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ? OR c.name LIKE ?)\n  ";
	return t === "favorites" && (i += " AND p.favorite = 1"), t === "recent" && (i += " AND p.updated_at >= datetime('now', '-7 days')"), i += " ORDER BY p.updated_at DESC LIMIT 100", n.all(i, [
		r,
		r,
		r,
		r
	]);
}
//#endregion
//#region electron/database/collections.js
async function j({ name: e, icon: t = "folder", color: n = "blue" }) {
	let r = m(), i = crypto.randomUUID(), a = (/* @__PURE__ */ new Date()).toISOString();
	return await r.run("INSERT INTO collections (id, name, icon, color, created_at) VALUES (?, ?, ?, ?, ?)", [
		i,
		e,
		t,
		n,
		a
	]), M(i);
}
async function M(e) {
	return await m().get("SELECT * FROM collections WHERE id = ?", [e]) || null;
}
async function N() {
	return m().all("SELECT * FROM collections ORDER BY created_at ASC");
}
async function P(e, { name: t, icon: n, color: r }) {
	return await m().run("UPDATE collections SET name = ?, icon = ?, color = ? WHERE id = ?", [
		t,
		n || "folder",
		r || "blue",
		e
	]), M(e);
}
async function F(e) {
	let t = m();
	return await t.run("UPDATE prompts SET collection_id = NULL WHERE collection_id = ?", [e]), await t.run("DELETE FROM collections WHERE id = ?", [e]), { success: !0 };
}
//#endregion
//#region electron/database/activity.js
async function I(e, t) {
	let n = m(), r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
	return await n.run("INSERT INTO activity_log (id, prompt_id, action, created_at) VALUES (?, ?, ?, ?)", [
		r,
		e,
		t,
		i
	]), r;
}
async function L(e = 50) {
	return await m().all("\n    SELECT a.*, p.title as prompt_title, p.content as prompt_content\n    FROM activity_log a\n    LEFT JOIN prompts p ON a.prompt_id = p.id\n    ORDER BY a.created_at DESC\n    LIMIT ?\n  ", [e]) || [];
}
//#endregion
//#region electron/database/io.js
async function R(t) {
	let r = m(), i = await r.all("SELECT * FROM prompts ORDER BY created_at DESC"), a = await r.all("SELECT * FROM collections ORDER BY created_at ASC"), o, c;
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
	let l = e.getFocusedWindow(), { canceled: u, filePath: d } = await n.showSaveDialog(l, {
		title: `Export as ${t.toUpperCase()}`,
		defaultPath: `promptnest-export.${t === "markdown" ? "md" : t}`,
		filters: c
	});
	return u || !d ? { canceled: !0 } : (s.writeFileSync(d, o, "utf-8"), {
		success: !0,
		filePath: d
	});
}
async function z() {
	let t = m(), r = e.getFocusedWindow(), { canceled: i, filePaths: a } = await n.showOpenDialog(r, {
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
		await t.get("SELECT id FROM prompts WHERE id = ?", [e.id]) ? await t.run("UPDATE prompts SET title = ?, content = ?, tags = ?, collection_id = ?, favorite = ?, is_template = ?, updated_at = ? WHERE id = ?", [
			e.title,
			e.content,
			e.tags || "",
			e.collection_id || null,
			e.favorite || 0,
			e.is_template || 0,
			(/* @__PURE__ */ new Date()).toISOString(),
			e.id
		]) : await t.run("INSERT INTO prompts (id, title, content, tags, collection_id, favorite, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
			e.id || crypto.randomUUID(),
			e.title,
			e.content,
			e.tags || "",
			e.collection_id || null,
			e.favorite || 0,
			e.is_template || 0,
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
var { autoUpdater: B } = c, V = o.dirname(a(import.meta.url));
process.env.APP_ROOT = o.join(V, "..");
var H = process.env.VITE_DEV_SERVER_URL, U = o.join(process.env.APP_ROOT, "dist-electron"), W = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = H ? o.join(process.env.APP_ROOT, "public") : W;
var G, K = !t.isPackaged;
function q(e, t = {}) {
	!G || G.isDestroyed() || G.webContents.send("updater:event", {
		type: e,
		payload: t
	});
}
function J() {
	B.autoDownload = !1, B.autoInstallOnAppQuit = !0, B.on("checking-for-update", () => {
		q("checking-for-update");
	}), B.on("update-available", (e) => {
		q("update-available", {
			version: e?.version ?? "",
			releaseDate: e?.releaseDate ?? "",
			releaseNotes: e?.releaseNotes ?? ""
		});
	}), B.on("update-not-available", () => {
		q("update-not-available");
	}), B.on("download-progress", (e) => {
		q("download-progress", {
			percent: e?.percent ?? 0,
			total: e?.total ?? 0,
			transferred: e?.transferred ?? 0,
			bytesPerSecond: e?.bytesPerSecond ?? 0
		});
	}), B.on("update-downloaded", (e) => {
		q("update-downloaded", { version: e?.version ?? "" });
	}), B.on("error", (e) => {
		q("error", { message: e?.message || "Auto update failed." });
	});
}
function Y() {
	G = new e({
		icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: o.join(V, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), G.webContents.on("did-finish-load", () => {
		G?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), H ? G.loadURL(H) : G.loadFile(o.join(W, "index.html"));
}
function X() {
	K || J(), r.handle("db:createPrompt", (e, t) => b(t)), r.handle("db:getPromptById", (e, t) => x(t)), r.handle("db:getAllPrompts", () => S()), r.handle("db:updatePrompt", (e, t, n) => w(t, n)), r.handle("db:deletePrompt", (e, t) => T(t)), r.handle("db:toggleFavorite", (e, t) => E(t)), r.handle("db:getFavorites", () => C()), r.handle("db:createCollection", (e, t) => j(t)), r.handle("db:getCollections", () => N()), r.handle("db:updateCollection", (e, t, n) => P(t, n)), r.handle("db:deleteCollection", (e, t) => F(t)), r.handle("db:logActivity", (e, t, n) => I(t, n)), r.handle("db:getActivity", (e, t) => L(t)), r.handle("db:exportData", (e, t) => R(t)), r.handle("db:importData", () => z()), r.handle("db:searchPrompts", (e, t, n) => A(t, n)), r.handle("db:getDashboardStats", () => v()), r.handle("db:getTemplates", () => D()), r.handle("db:createTemplate", (e, t) => O(t)), r.handle("db:deleteTemplate", (e, t) => k(t)), r.handle("db:getDatabaseStats", () => y()), r.handle("app:getVersion", () => t.getVersion()), r.handle("updater:get-app-version", () => {
		if (K) try {
			let e = o.join(V, "..", "package.json"), t = JSON.parse(s.readFileSync(e, "utf8"));
			if (t?.version) return t.version;
		} catch {}
		return t.getVersion();
	}), r.handle("updater:check-for-updates", async () => {
		if (K) return {
			ok: !1,
			devMode: !0,
			message: "Packaged builds only."
		};
		try {
			return await B.checkForUpdates(), { ok: !0 };
		} catch (e) {
			return {
				ok: !1,
				message: e?.message
			};
		}
	}), r.handle("updater:download-update", async () => {
		if (K) return {
			ok: !1,
			devMode: !0,
			message: "Packaged builds only."
		};
		try {
			return await B.downloadUpdate(), { ok: !0 };
		} catch (e) {
			return {
				ok: !1,
				message: e?.message
			};
		}
	}), r.handle("updater:quit-and-install", () => K ? {
		ok: !1,
		devMode: !0,
		message: "Packaged builds only."
	} : (setImmediate(() => B.quitAndInstall(!1, !0)), { ok: !0 })), r.handle("updater:pause-download", () => {
		try {
			return B.pauseDownload(), { ok: !0 };
		} catch (e) {
			return {
				ok: !1,
				message: e.message
			};
		}
	}), r.handle("updater:resume-download", () => {
		try {
			return B.resumeDownload(), { ok: !0 };
		} catch (e) {
			return {
				ok: !1,
				message: e.message
			};
		}
	}), r.handle("db:openDbFolder", async () => {
		let e = o.join(t.getPath("userData"), "PromptNest");
		await i.openPath(e);
	}), r.handle("db:backupDatabase", async () => {
		let e = o.join(t.getPath("userData"), "PromptNest"), n = o.join(e, "promptnest.db"), r = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), i = o.join(e, `promptnest-backup-${r}.db`);
		return s.copyFileSync(n, i), {
			success: !0,
			path: i
		};
	});
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), G = null);
}), t.on("activate", () => {
	e.getAllWindows().length === 0 && Y();
}), t.whenReady().then(async () => {
	await h(), X(), Y();
}), t.on("will-quit", () => {
	_();
});
//#endregion
export { U as MAIN_DIST, W as RENDERER_DIST, H as VITE_DEV_SERVER_URL };
