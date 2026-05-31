/* global console, process */
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import yaml from "js-yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const { version } = pkg
const productName = pkg.build?.productName || pkg.productName || pkg.name
const tag = `v${version}`
const { owner, repo: repoName } = pkg.build?.publish?.[0] || {}
const repo = `${owner}/${repoName}`
const token = process.env.GH_TOKEN
const dir = path.join(root, "release")
const ymlPath = path.join(dir, "latest.yml")

if (!token) {
  console.error("GH_TOKEN not set")
  process.exit(1)
}

if (!owner || !repoName) {
  console.error("GitHub publish owner/repo is missing in package.json build.publish")
  process.exit(1)
}

function commandName(command) {
  return process.platform === "win32" && command === "npx" ? "npx.cmd" : command
}

function run(command, args, options = {}) {
  const result = spawnSync(commandName(command), args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    ...options,
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function runQuiet(command, args) {
  return spawnSync(commandName(command), args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  })
}

function assertFileExists(filePath, label) {
  if (!existsSync(filePath)) {
    console.error(`${label} not found: ${filePath}`)
    console.error("Release directory contains:")
    for (const file of existsSync(dir) ? readdirSync(dir) : []) {
      console.error(`  ${file}`)
    }
    process.exit(1)
  }
}

function validateLatestYml(updateInfo) {
  if (updateInfo.version !== version) {
    console.error(`latest.yml version mismatch: expected ${version}, got ${updateInfo.version}`)
    process.exit(1)
  }

  if (!Array.isArray(updateInfo.files) || updateInfo.files.length === 0) {
    console.error("latest.yml has no files entries")
    process.exit(1)
  }

  for (const file of updateInfo.files) {
    if (!file.url || !file.sha512 || !file.size) {
      console.error(`Invalid latest.yml file entry: ${JSON.stringify(file)}`)
      process.exit(1)
    }

    if (file.url.endsWith(".blockmap")) {
      console.error("latest.yml must not list .blockmap as an update file. Let electron-builder generate metadata unchanged.")
      process.exit(1)
    }

    const artifactPath = path.join(dir, file.url)
    assertFileExists(artifactPath, "Installer artifact")
    const actualSize = statSync(artifactPath).size
    if (actualSize !== file.size) {
      console.error(`Size mismatch for ${file.url}: latest.yml=${file.size}, disk=${actualSize}`)
      process.exit(1)
    }
  }

  const installerFromPath = updateInfo.path && path.join(dir, updateInfo.path)
  if (installerFromPath) assertFileExists(installerFromPath, "latest.yml path artifact")
}

function uploadAsset(filePath) {
  run("gh", ["release", "upload", tag, "--repo", repo, filePath, "--clobber"])
}

console.log(`Cleaning release output: ${dir}`)
rmSync(dir, { recursive: true, force: true })

console.log(`Building ${productName} v${version}...`)
run("npx", ["vite", "build"])
run("npx", ["electron-builder", "--win", "nsis", "--publish", "never"])

assertFileExists(ymlPath, "latest.yml")
const updateInfo = yaml.load(readFileSync(ymlPath, "utf8"))
validateLatestYml(updateInfo)

const installerFiles = updateInfo.files.map(file => path.join(dir, file.url))
const blockmapFiles = installerFiles
  .map(file => `${file}.blockmap`)
  .filter(file => existsSync(file))

if (blockmapFiles.length !== installerFiles.length) {
  console.error("Every NSIS installer must have a matching .blockmap for differential updates.")
  for (const file of installerFiles) {
    if (!existsSync(`${file}.blockmap`)) console.error(`  Missing: ${file}.blockmap`)
  }
  process.exit(1)
}

console.log("Validated artifacts:")
for (const file of [...installerFiles, ...blockmapFiles, ymlPath]) {
  const sizeMb = (statSync(file).size / 1024 / 1024).toFixed(2)
  console.log(`  ${path.basename(file)} (${sizeMb} MB)`)
}

const existingRelease = runQuiet("gh", ["release", "view", tag, "--repo", repo, "--json", "isDraft"])

if (existingRelease.status === 0) {
  console.log(`Release ${tag} already exists; assets will be replaced.`)
} else {
  console.log(`Creating draft release ${tag}...`)
  run("gh", [
    "release",
    "create",
    tag,
    "--repo",
    repo,
    "--title",
    `${productName} v${version}`,
    "--notes",
    `Release v${version}`,
    "--draft",
  ])
}

console.log("Uploading installers first...")
for (const file of installerFiles) uploadAsset(file)

console.log("Uploading blockmaps...")
for (const file of blockmapFiles) uploadAsset(file)

console.log("Uploading latest.yml last...")
uploadAsset(ymlPath)

if (existingRelease.status !== 0) {
  console.log("Publishing draft release...")
  run("gh", ["release", "edit", tag, "--repo", repo, "--draft=false"])
}

console.log(`Done: https://github.com/${repo}/releases/tag/${tag}`)
