// File: scripts/release-patch.mjs — DEPRECATED
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))

console.log(`
[release-patch.mjs] DEPRECATED
The custom asar-patch mechanism has been removed in favor of electron-updater's
native NSIS differential update support.

Use these instead:
  npm run dist:win:publish       # Build + publish full release
  npm run release                # Build + upload all artifacts (v${version})
`)
