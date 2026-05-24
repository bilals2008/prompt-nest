/* eslint-env node */
import { readFileSync, statSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const { version } = pkg
const productName = pkg.build?.productName || pkg.productName || pkg.name
const tag = `v${version}`

const repo = "bilals2008/prompt-nest"
const token = process.env.GH_TOKEN
if (!token) { console.error("GH_TOKEN not set"); process.exit(1) }

const GH = "https://api.github.com"
const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }

async function api(method, url, body) {
  const resp = await fetch(url, { method, headers, body })
  if (!resp.ok && resp.status !== 404) {
    const text = await resp.text()
    throw new Error(`API ${method} ${url} (${resp.status}): ${text}`)
  }
  const text = await resp.text()
  return text ? JSON.parse(text) : null
}

async function ensureRelease() {
  let release = await api("GET", `${GH}/repos/${repo}/releases/tags/${tag}`)
  if (release) return release.id

  console.log(`Creating release ${tag}...`)
  release = await api("POST", `${GH}/repos/${repo}/releases`, JSON.stringify({
    tag_name: tag, name: `${productName} v${version}`,
    body: `Release v${version}`,
  }))
  return release.id
}

async function uploadAsset(releaseId, filePath, name) {
  if (!existsSync(filePath)) { console.log(`  Skipping ${name} (not found)`); return }
  const stat = statSync(filePath)
  const buf = readFileSync(filePath)
  const url = `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`
  console.log(`Uploading ${name} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`)
  const start = Date.now()
  const resp = await fetch(url, {
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
    throw new Error(`Upload failed (${resp.status}): ${text}`)
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`  Done in ${elapsed}s (${(stat.size / 1024 / 1024 / elapsed * 60).toFixed(1)} MB/min)`)
}

const releaseId = await ensureRelease()
console.log(`Release ${tag} ready (id: ${releaseId})\n`)

const dir = path.join(root, "release")
const sanitizedProductName = productName.replace(/\s+/g, "-")
const exeName = `${sanitizedProductName}-Setup-${version}.exe`
const blockmapName = `${sanitizedProductName}-Setup-${version}.exe.blockmap`

await uploadAsset(releaseId, path.join(dir, exeName), exeName)
await uploadAsset(releaseId, path.join(dir, blockmapName), blockmapName)
await uploadAsset(releaseId, path.join(dir, "latest.yml"), "latest.yml")
await uploadAsset(releaseId, path.join(dir, "latest-mac.yml"), "latest-mac.yml")
await uploadAsset(releaseId, path.join(dir, "latest-linux.yml"), "latest-linux.yml")

console.log("\nAll done!")
