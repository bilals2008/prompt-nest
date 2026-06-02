import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  IconFileCode,
  IconFileDescription,
  IconFileTypeTxt,
  IconFileSpreadsheet,
  IconDownload,
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconX,
  IconListCheck,
  IconFolder,
  IconNotes,
  IconCloudUpload,
} from "@tabler/icons-react"
import { toast } from "sonner"

const exportFormats = [
  { id: "json", label: "JSON", icon: IconFileCode, desc: "Full backup with prompts and collections", color: "text-chart-4 bg-chart-4/10" },
  { id: "markdown", label: "Markdown", icon: IconFileDescription, desc: "Readable document format (.md)", color: "text-chart-2 bg-chart-2/10" },
  { id: "txt", label: "Plain Text", icon: IconFileTypeTxt, desc: "Simple text format (.txt)", color: "text-muted-foreground bg-muted" },
  { id: "csv", label: "CSV", icon: IconFileSpreadsheet, desc: "Spreadsheet-friendly format (.csv)", color: "text-chart-3 bg-chart-3/10" },
]

function detectFormat(fileName, content) {
  const ext = fileName.split(".").pop().toLowerCase()
  if (ext === "json") return "json"
  if (ext === "csv") return "csv"
  if (ext === "md" || ext === "markdown") return "markdown"
  const trimmed = content.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  if (trimmed.includes(",")) return "csv"
  if (trimmed.startsWith("#") || trimmed.startsWith("---")) return "markdown"
  return null
}

function normalizePrompt(raw) {
  const content = (raw.content || raw.text || raw.body || "").trim()
  const title = (raw.title || "").trim()
  let tags = raw.tags || raw.tag || ""
  if (Array.isArray(tags)) tags = tags.join(", ")
  tags = String(tags).trim()
  const favorite = raw.favorite || raw.isFavorite ? 1 : 0
  const collection_id = raw.collection_id || null
  return { title, content, tags, favorite, collection_id }
}

function parseCSVFrontend(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false
  let i = 0
  while (i < normalized.length) {
    const ch = normalized[i]
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i += 2 }
        else { inQuotes = false; i++ }
      } else { field += ch; i++ }
    } else {
      if (ch === '"' && field === "") { inQuotes = true; i++ }
      else if (ch === ",") { row.push(field); field = ""; i++ }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++ }
      else { field += ch; i++ }
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

export default function ExportImport() {
  const [exporting, setExporting] = useState(null)
  const [result, setResult] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [collections, setCollections] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectiveOpen, setSelectiveOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("json")
  const [selectedPromptIds, setSelectedPromptIds] = useState(new Set())
  const [selectedCollectionIds, setSelectedCollectionIds] = useState(new Set())
  const [selectScope, setSelectScope] = useState("all")
  const [isDragging, setIsDragging] = useState(false)
  const [importFlow, setImportFlow] = useState({ status: "idle", format: null, fileName: null, prompts: [], valid: 0, skipped: 0, result: null, error: null })
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setResult(null), 6000)
      return () => clearTimeout(t)
    }
  }, [result])

  const loadStats = useCallback(() => {
    setStatsLoading(true)
    Promise.all([
      window.db.getAllPrompts().catch(() => []),
      window.db.getCollections().catch(() => []),
    ]).then(([prs, cols]) => {
      setPrompts(Array.isArray(prs) ? prs : [])
      setCollections(Array.isArray(cols) ? cols : [])
    }).catch(console.error).finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const totalPrompts = prompts.length
  const totalCollections = collections.length
  const selectedPromptsCount = (() => {
    if (selectScope === "all") return prompts.length
    if (selectScope === "collections" && selectedCollectionIds.size > 0) {
      const cols = new Set(selectedCollectionIds)
      return prompts.filter((p) => p.collection_id && cols.has(p.collection_id)).length
    }
    if (selectScope === "prompts") return selectedPromptIds.size
    return 0
  })()

  const handleExport = async (format, options = null) => {
    setExporting(format)
    setResult(null)
    try {
      const res = await window.db.exportData(format, options)
      if (res.canceled) {
        setExporting(null)
        return
      }
      if (res.success) {
        const detail = options
          ? `${res.counts.prompts} prompts, ${res.counts.collections} collections`
          : res.filePath
        setResult({ type: "success", message: "Exported successfully", detail })
        toast.success(`Exported as ${format.toUpperCase()}`)
      }
    } catch (err) {
      setResult({ type: "error", message: "Export failed", detail: err.message })
      toast.error("Export failed")
    }
    setExporting(null)
  }

  const handleSelectiveExport = () => {
    const options = buildExportOptions()
    if (!options) {
      toast.error("Please select at least one item to export")
      return
    }
    setSelectiveOpen(false)
    handleExport(selectedFormat, options)
  }

  const buildExportOptions = () => {
    if (selectScope === "all") return null
    if (selectScope === "collections" && selectedCollectionIds.size === 0) return null
    if (selectScope === "prompts" && selectedPromptIds.size === 0) return null
    if (selectScope === "collections") {
      return { collectionIds: Array.from(selectedCollectionIds) }
    }
    if (selectScope === "prompts") {
      return { promptIds: Array.from(selectedPromptIds) }
    }
    return null
  }

  const processImportFile = async (file) => {
    if (!file) return
    setImportFlow((s) => ({ ...s, status: "parsing", fileName: file.name, error: null }))
    try {
      const text = await file.text()
      const format = detectFormat(file.name, text)
      if (!format) {
        setImportFlow((s) => ({ ...s, status: "error", error: "Unrecognized file format. Use .json, .csv, or .md" }))
        return
      }
      let prompts = []
      if (format === "json") {
        const data = JSON.parse(text)
        const raw = Array.isArray(data) ? data : Array.isArray(data.prompts) ? data.prompts : []
        prompts = raw.map(normalizePrompt).filter((p) => p.content)
      } else if (format === "csv") {
        const rows = parseCSVFrontend(text)
        if (rows.length < 2) { setImportFlow((s) => ({ ...s, status: "error", error: "CSV file is empty or missing rows" })); return }
        const header = rows[0].map((h) => h.trim().toLowerCase())
        const idx = (name) => header.indexOf(name)
        const tIdx = idx("title"), cIdx = idx("content"), tgIdx = idx("tags"), fIdx = idx("favorite"), ciIdx = idx("collection_id")
        if (cIdx === -1) { setImportFlow((s) => ({ ...s, status: "error", error: 'CSV must have a "content" column' })); return }
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r]
          const title = (row[tIdx] || "").trim()
          const content = (row[cIdx] || "").trim()
          if (!content) continue
          const tags = tgIdx !== -1 ? (row[tgIdx] || "").trim() : ""
          const favorite = fIdx !== -1 && /^(1|true|yes)$/i.test((row[fIdx] || "").trim()) ? 1 : 0
          const collection_id = ciIdx !== -1 && row[ciIdx] ? row[ciIdx].trim() : null
          prompts.push(normalizePrompt({ title, content, tags, favorite, collection_id }))
        }
      } else if (format === "markdown") {
        const sections = text.split(/\n---\n/).filter((s) => s.trim())
        for (const sec of sections) {
          const lines = sec.split("\n")
          const titleMatch = lines.find((l) => /^#\s+/.test(l))
          const title = titleMatch ? titleMatch.replace(/^#\s+/, "").trim() : ""
          let tags = ""
          let content = ""
          let collecting = false
          for (const line of lines) {
            if (/^#\s+/.test(line)) continue
            if (/^\*\*Tags?:\*\*/i.test(line)) { tags = line.replace(/^\*\*Tags?:\*\*\s*/i, "").trim(); continue }
            if (line.trim() === "") { if (collecting) content += "\n"; continue }
            content += (content ? "\n" : "") + line
            collecting = true
          }
          if (content.trim()) prompts.push(normalizePrompt({ title, tags, content: content.trim() }))
        }
      }
      const valid = prompts.length
      const skipped = (format === "csv" ? parseCSVFrontend(text).length - 1 : 0) - valid
      setImportFlow((s) => ({ ...s, status: "preview", format, prompts, valid, skipped: Math.max(0, skipped) }))
    } catch (err) {
      setImportFlow((s) => ({ ...s, status: "error", error: err.message || "Failed to parse file" }))
    }
  }

  const handleCommitImport = async () => {
    setImportFlow((s) => ({ ...s, status: "importing" }))
    try {
      const res = await window.db.commitImport(importFlow.prompts)
      setImportFlow((s) => ({ ...s, status: "done", result: res }))
      loadStats()
      toast.success(`Imported ${res.imported} prompts`)
    } catch (err) {
      setImportFlow((s) => ({ ...s, status: "error", error: err.message || "Import failed" }))
      toast.error("Import failed")
    }
  }

  const handleImportAnother = () => {
    setImportFlow({ status: "idle", format: null, fileName: null, prompts: [], valid: 0, skipped: 0, result: null, error: null })
  }

  const processDroppedFile = async (file) => {
    if (!file) return
    processImportFile(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processDroppedFile(file)
  }

  const openSelective = () => {
    setSelectedPromptIds(new Set())
    setSelectedCollectionIds(new Set())
    setSelectScope("all")
    setSelectedFormat("json")
    setSelectiveOpen(true)
  }

  const togglePrompt = (id) => {
    setSelectedPromptIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCollection = (id) => {
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllPrompts = () => setSelectedPromptIds(new Set(prompts.map((p) => p.id)))
  const clearAllPrompts = () => setSelectedPromptIds(new Set())
  const selectAllCollections = () => setSelectedCollectionIds(new Set(collections.map((c) => c.id)))
  const clearAllCollections = () => setSelectedCollectionIds(new Set())

  return (
    <div
      className="relative flex h-full flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <IconDownload className="size-5" />
          Export / Import
        </h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {result && (
            <div className={cn(
              "relative flex items-start gap-3 rounded-xl border px-4 py-3 pr-10",
              result.type === "success" ? "border-chart-2/30 bg-chart-2/5" : "border-destructive/30 bg-destructive/5"
            )}>
              {result.type === "success" ? (
                <IconCheck className="mt-0.5 size-4 shrink-0 text-chart-2" />
              ) : (
                <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{result.message}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{result.detail}</p>
              </div>
              <button onClick={() => setResult(null)} className="absolute right-2 top-2 flex cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                <IconX className="size-3.5" />
              </button>
            </div>
          )}

          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IconDownload className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Export</h2>
                <p className="text-xs text-muted-foreground">Export all prompts and collections to your preferred format</p>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill
                icon={IconNotes}
                label="Prompts"
                value={statsLoading ? "—" : totalPrompts}
                accent="text-primary bg-primary/10"
              />
              <StatPill
                icon={IconFolder}
                label="Collections"
                value={statsLoading ? "—" : totalCollections}
                accent="text-chart-2 bg-chart-2/10"
              />
              <div className="col-span-2 flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSelective}
                  disabled={exporting !== null || totalPrompts === 0}
                  className="cursor-pointer gap-1.5"
                >
                  <IconListCheck className="size-3.5" />
                  Selective Export...
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {exportFormats.map((fmt) => {
                const Icon = fmt.icon
                const isLoading = exporting === fmt.id
                return (
                  <Button
                    key={fmt.id}
                    variant="outline"
                    onClick={() => handleExport(fmt.id)}
                    disabled={exporting !== null || totalPrompts === 0}
                    className="group flex-col items-start gap-4 p-6 text-left h-auto min-h-[170px] cursor-pointer"
                  >
                    <div className={cn("flex size-11 items-center justify-center rounded-xl shrink-0", fmt.color)}>
                      {isLoading ? (
                        <IconRefresh className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <div className="w-full min-w-0">
                      <h3 className="text-sm font-semibold">{fmt.label}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground break-words">{fmt.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <IconDownload className="size-3" />
                      Export {fmt.label}
                    </div>
                  </Button>
                )
              })}
            </div>
          </section>

          <Separator />

          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                <IconUpload className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Import</h2>
                <p className="text-xs text-muted-foreground">Restore from backup or bulk import — accepts .json, .csv, .md</p>
              </div>
            </div>

            {importFlow.status === "idle" && (
              <>
                <div
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; setIsDragging(true) }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false) } }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setIsDragging(false); const file = e.dataTransfer?.files?.[0]; if (file) processImportFile(file) }}
                  className="flex cursor-default flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card/20 px-6 py-10 transition-colors hover:border-muted-foreground/40 hover:bg-card/30"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <IconCloudUpload className="size-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Drop a file here</p>
                    <p className="mt-1 text-xs text-muted-foreground">or</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                    <IconUpload className="size-3.5" />
                    Browse files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.md,.markdown"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processImportFile(f); e.target.value = "" }}
                  />
                </div>
              </>
            )}

            {importFlow.status === "parsing" && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
                <IconRefresh className="size-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing {importFlow.fileName}...</p>
              </div>
            )}

            {importFlow.status === "preview" && (
              <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2 shrink-0">
                    <IconCheck className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Ready to import</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">{importFlow.format}</Badge>
                      <span className="text-xs text-muted-foreground truncate">{importFlow.fileName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-chart-2">
                    <IconCheck className="size-3.5" />
                    <span className="font-semibold">{importFlow.valid}</span> valid
                  </div>
                  {importFlow.skipped > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconX className="size-3.5" />
                      <span className="font-semibold">{importFlow.skipped}</span> skipped
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleImportAnother} className="cursor-pointer">Cancel</Button>
                  <Button size="sm" onClick={handleCommitImport} className="cursor-pointer">
                    <IconDownload className="size-3.5" />
                    Import {importFlow.valid} prompt{importFlow.valid === 1 ? "" : "s"}
                  </Button>
                </div>
              </div>
            )}

            {importFlow.status === "importing" && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
                <IconRefresh className="size-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Importing {importFlow.valid} prompts...</p>
              </div>
            )}

            {importFlow.status === "done" && (
              <div className="rounded-xl border border-chart-2/30 bg-chart-2/5 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-chart-2" />
                  <div>
                    <p className="text-sm font-semibold">Import complete</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {importFlow.result?.imported} imported{importFlow.result?.failed > 0 ? `, ${importFlow.result.failed} failed` : ""}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleImportAnother} className="cursor-pointer">
                  <IconUpload className="size-3.5" />
                  Import another file
                </Button>
              </div>
            )}

            {importFlow.status === "error" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">Import failed</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{importFlow.error}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleImportAnother} className="cursor-pointer">
                  Try again
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card px-10 py-8 shadow-lg">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconCloudUpload className="size-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Drop file to import</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Accepts .json, .csv, .md</p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={selectiveOpen} onOpenChange={setSelectiveOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selective Export</DialogTitle>
            <DialogDescription>
              Choose which items to include in this export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Format</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon
                  const active = selectedFormat === fmt.id
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {fmt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Scope</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All items" },
                  { id: "collections", label: "By collection" },
                  { id: "prompts", label: "By prompt" },
                ].map((opt) => {
                  const active = selectScope === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectScope(opt.id)}
                      className={cn(
                        "flex h-8 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectScope === "all" && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                Will export <span className="font-semibold text-foreground">{totalPrompts}</span> prompts and <span className="font-semibold text-foreground">{totalCollections}</span> collections.
              </div>
            )}

            {selectScope === "collections" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedCollectionIds.size} of {collections.length} selected
                  </p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="xs" onClick={selectAllCollections} className="cursor-pointer">Select all</Button>
                    <Button type="button" variant="ghost" size="xs" onClick={clearAllCollections} className="cursor-pointer">Clear</Button>
                  </div>
                </div>
                <ScrollArea className="h-56 rounded-lg border border-border">
                  {collections.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">No collections yet</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {collections.map((c) => {
                        const checked = selectedCollectionIds.has(c.id)
                        const count = prompts.filter((p) => p.collection_id === c.id).length
                        return (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleCollection(c.id)}
                            />
                            <IconFolder className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-sm">{c.name}</span>
                            <Badge variant="secondary" className="text-[10px] font-normal">{count} prompts</Badge>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
                {selectedCollectionIds.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Will export <span className="font-semibold text-foreground">{selectedPromptsCount}</span> prompts in {selectedCollectionIds.size} collection{selectedCollectionIds.size === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
            )}

            {selectScope === "prompts" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedPromptIds.size} of {prompts.length} selected
                  </p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="xs" onClick={selectAllPrompts} className="cursor-pointer">Select all</Button>
                    <Button type="button" variant="ghost" size="xs" onClick={clearAllPrompts} className="cursor-pointer">Clear</Button>
                  </div>
                </div>
                <ScrollArea className="h-56 rounded-lg border border-border">
                  {prompts.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">No prompts yet</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {prompts.map((p) => {
                        const checked = selectedPromptIds.has(p.id)
                        return (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-start gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => togglePrompt(p.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{p.title || "Untitled"}</p>
                              {p.content && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.content}</p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectiveOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button
              onClick={handleSelectiveExport}
              disabled={selectScope !== "all" && selectedPromptsCount === 0}
              className="cursor-pointer"
            >
              <IconDownload className="size-3.5" />
              Export {selectedPromptsCount} prompt{selectedPromptsCount === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5">
      <div className={cn("flex size-8 items-center justify-center rounded-lg", accent)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base font-semibold leading-none">{value}</p>
      </div>
    </div>
  )
}

function Separator() {
  return <hr className="border-border" />
}
