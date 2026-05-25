import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const { version } = pkg
const productName = pkg.build?.productName || pkg.productName || pkg.name
const tag = `v${version}`
const { owner, repo: repoName } = pkg.build?.publish?.[0] || {}
const repo = `${owner}/${repoName}`
const token = process.env.GH_TOKEN
if (!token) { console.error("GH_TOKEN not set"); process.exit(1) }
const dir = path.join(root, "release")

// 1. Build the app first (ensures fresh artifacts + latest.yml)
console.log(`Building ${productName} v${version}...`)
execSync("npx vite build && npx electron-builder --win nsis", { cwd: root, stdio: "inherit" })

// 2. Parse latest.yml to discover actual filenames
const ymlPath = path.join(dir, "latest.yml")
if (!existsSync(ymlPath)) {
  console.error("latest.yml not found — build failed?")
  process.exit(1)
}
let ymlText = readFileSync(ymlPath, "utf8")

function parseYmlUrls(text) {
  const files = []
  const lines = text.split("\n")
  let inFiles = false
  for (const line of lines) {
    if (line.startsWith("files:")) { inFiles = true; continue }
    if (inFiles && line.match(/^\S/)) inFiles = false
    if (inFiles && line.startsWith("  - url:")) {
      files.push(line.replace(/^  - url:\s*/, "").trim())
    }
  }
  return files
}

const urls = parseYmlUrls(ymlText)
if (!urls.length) {
  console.error("latest.yml has no files")
  process.exit(1)
}

// Add blockmap files to latest.yml if missing (electron-builder sometimes omits them)
let ymlModified = false
for (const url of [...urls]) {
  if (url.endsWith(".exe")) {
    const blockmapUrl = url + ".blockmap"
    if (!urls.includes(blockmapUrl) && existsSync(path.join(dir, blockmapUrl))) {
      const { createHash } = await import("node:crypto")
      const buf = readFileSync(path.join(dir, blockmapUrl))
      const sha512 = createHash("sha512").update(buf).digest("base64")
      urls.push(blockmapUrl)
      // Insert blockmap entry after the last entry in the files array (before "path:")
      const insertPos = ymlText.lastIndexOf("\npath:")
      ymlText = ymlText.slice(0, insertPos) + `  - url: ${blockmapUrl}\n    sha512: ${sha512}\n    size: ${buf.length}\n` + ymlText.slice(insertPos)
      ymlModified = true
    }
  }
}
if (ymlModified) {
  writeFileSync(ymlPath, ymlText)
  console.log("Added blockmap entries to latest.yml")
}

console.log("Found artifacts:", urls.join(", "))

// Validate all files from latest.yml exist on disk
for (const url of urls) {
  const localPath = path.join(dir, url)
  if (!existsSync(localPath)) {
    console.error(`MISMATCH: latest.yml says "${url}" but file not found at: ${localPath}`)
    console.log("Available files:")
    const { readdirSync } = await import("node:fs")
    for (const f of readdirSync(dir).filter(f => f.endsWith(".exe") || f.endsWith(".blockmap") || f.endsWith(".yml"))) {
      console.log(`  ${f}`)
    }
    process.exit(1)
  }
}

// 3. Create GitHub release with retry
function execWithRetry(cmd, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { execSync(cmd, opts); return } catch (e) {
      if (i === retries - 1) throw e
      console.log(`  Retry ${i + 1}/${retries}...`)
    }
  }
}

try {
  execWithRetry(`gh release view ${tag} --repo ${repo}`, { stdio: "pipe" })
  console.log(`Release ${tag} already exists — will clobber assets`)
} catch {
  console.log(`Creating release ${tag}...`)
  execWithRetry(`gh release create ${tag} --repo ${repo} --title "${productName} v${version}" --notes "Release v${version}"`, { stdio: "inherit" })
}

// 4. Get release ID from GH API with retry
async function fetchWithRetry(url, opts, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts) } catch (e) {
      if (i === retries - 1) throw e
      console.log(`  API retry ${i + 1}/${retries}... (${e?.cause?.code || e.message})`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}

const idResp = await fetchWithRetry(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
})
if (!idResp.ok) {
  const text = await idResp.text()
  throw new Error(`API ${idResp.status}: ${text.slice(0, 200)}`)
}
const { id: releaseId } = await idResp.json()
console.log(`Release ID: ${releaseId}`)

// 5. Upload small files (non-exe) via gh CLI
const smallFiles = urls
  .filter(u => !u.endsWith(".exe"))
  .map(u => path.join(dir, u))
  .filter(f => existsSync(f))

if (smallFiles.length) {
  console.log("Uploading small files via gh...")
  execSync(`gh release upload ${tag} --repo ${repo} ${smallFiles.map(f => `"${f}"`).join(" ")} --clobber`, { stdio: "inherit" })
}

// Upload latest.yml too
if (existsSync(ymlPath)) {
  execSync(`gh release upload ${tag} --repo ${repo} "${ymlPath}" --clobber`, { stdio: "inherit" })
}

// 6. Upload exe(s) via API directly (avoids gh CLI timeout on large files)
for (const url of urls) {
  if (!url.endsWith(".exe")) continue
  const localPath = path.join(dir, url)
  if (!existsSync(localPath)) {
    console.error(`EXE not found at: ${localPath}`)
    process.exit(1)
  }
  const stat = statSync(localPath)
  const buf = readFileSync(localPath)
  const uploadUrl = `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(url)}`
  console.log(`Uploading ${url} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`)
  const start = Date.now()
  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(stat.size),
      Authorization: `Bearer ${token}`,
    },
    body: buf,
  })
  if (!resp.ok) {
    const text = await resp.text()
    console.error(`Upload failed (${resp.status}): ${text.slice(0, 200)}`)
    process.exit(1)
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`  Done in ${elapsed}s`)
}

console.log(`\nDone! https://github.com/${repo}/releases/tag/${tag}`)
