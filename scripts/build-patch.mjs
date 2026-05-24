// File: scripts/build-patch.mjs — DEPRECATED
/* eslint-env node */
console.log(`
[build-patch.mjs] DEPRECATED
The custom asar-patch mechanism has been removed in favor of electron-updater's
native NSIS differential update support (via blockmap files).

Use these commands instead:
  npm run dist:win              # Build NSIS installer
  npm run dist:win:publish      # Build + publish to GitHub
  npm run release               # Build + upload all artifacts to GitHub
`)
