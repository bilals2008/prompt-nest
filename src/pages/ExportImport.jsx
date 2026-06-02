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
  IconFileImport,
  IconHistory,
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

export default function ExportImport() {
  const [exporting, setExporting] = useState(null)
  const [importing, setImporting] = useState(false)
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

  const handleImport = async () => {
    setImporting(true)
    setResult(null)
    try {
      const res = await window.db.importData()
      if (res.canceled) {
        setImporting(false)
        return
      }
      if (res.error) {
        setResult({ type: "error", message: "Import failed", detail: res.error })
        toast.error("Import failed")
      } else if (res.success) {
        setResult({ type: "success", message: "Import complete", detail: `${res.prompts} prompts, ${res.collections} collections imported${res.errors > 0 ? ` (${res.errors} errors)` : ""}` })
        toast.success("Import complete")
        loadStats()
      }
    } catch (err) {
      setResult({ type: "error", message: "Import failed", detail: err.message })
      toast.error("Import failed")
    }
    setImporting(false)
  }

  const handleImportCsv = async () => {
    setImporting(true)
    setResult(null)
    try {
      const res = await window.db.importCsv()
      if (res.canceled) {
        setImporting(false)
        return
      }
      if (res.error) {
        setResult({ type: "error", message: "CSV import failed", detail: res.error })
        toast.error("CSV import failed")
      } else if (res.success) {
        setResult({ type: "success", message: "CSV imported", detail: `${res.prompts} prompts imported${res.errors > 0 ? ` (${res.errors} skipped)` : ""}` })
        toast.success("CSV imported")
        loadStats()
      }
    } catch (err) {
      setResult({ type: "error", message: "CSV import failed", detail: err.message })
      toast.error("CSV import failed")
    }
    setImporting(false)
  }

  const processDroppedFile = async (file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    setImporting(true)
    setResult(null)
    try {
      let res
      if (name.endsWith(".csv")) {
        res = await window.db.importCsv(file.path)
        if (res.error) {
          setResult({ type: "error", message: "CSV import failed", detail: res.error })
          toast.error("CSV import failed")
        } else if (res.success) {
          setResult({ type: "success", message: "CSV imported", detail: `${res.prompts} prompts imported${res.errors > 0 ? ` (${res.errors} skipped)` : ""}` })
          toast.success("CSV imported")
          loadStats()
        }
      } else if (name.endsWith(".json")) {
        res = await window.db.importData(file.path)
        if (res.error) {
          setResult({ type: "error", message: "Import failed", detail: res.error })
          toast.error("Import failed")
        } else if (res.success) {
          setResult({ type: "success", message: "Import complete", detail: `${res.prompts} prompts, ${res.collections} collections imported${res.errors > 0 ? ` (${res.errors} errors)` : ""}` })
          toast.success("Import complete")
          loadStats()
        }
      } else {
        setResult({ type: "error", message: "Unsupported file type", detail: "Please drop a .json or .csv file" })
        toast.error("Unsupported file type")
      }
    } catch (err) {
      setResult({ type: "error", message: "Import failed", detail: err.message })
      toast.error("Import failed")
    }
    setImporting(false)
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
        <div className="mx-auto max-w-3xl space-y-8">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {exportFormats.map((fmt) => {
                const Icon = fmt.icon
                const isLoading = exporting === fmt.id
                return (
                  <Button
                    key={fmt.id}
                    variant="outline"
                    onClick={() => handleExport(fmt.id)}
                    disabled={exporting !== null || totalPrompts === 0}
                    className="group flex-col items-start gap-3 p-5 text-left h-auto cursor-pointer"
                  >
                    <div className={cn("flex size-10 items-center justify-center rounded-xl", fmt.color)}>
                      {isLoading ? (
                        <IconRefresh className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <div className="w-full">
                      <h3 className="text-sm font-semibold">{fmt.label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{fmt.desc}</p>
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
                <p className="text-xs text-muted-foreground">Restore from a backup or bulk import prompts — drag &amp; drop a .json or .csv file anywhere on this page</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={importing}
                className="group flex-col items-start gap-3 p-5 text-left h-auto cursor-pointer"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                  {importing ? (
                    <IconRefresh className="size-5 animate-spin" />
                  ) : (
                    <IconFileImport className="size-5" />
                  )}
                </div>
                <div className="w-full">
                  <h3 className="text-sm font-semibold">Restore Backup</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Import from a previously exported JSON backup</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-chart-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconUpload className="size-3" />
                  Choose file
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleImportCsv}
                disabled={importing}
                className="group flex-col items-start gap-3 p-5 text-left h-auto cursor-pointer"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                  {importing ? (
                    <IconRefresh className="size-5 animate-spin" />
                  ) : (
                    <IconHistory className="size-5" />
                  )}
                </div>
                <div className="w-full">
                  <h3 className="text-sm font-semibold">Bulk Import CSV</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Import multiple prompts from a CSV (title, content, tags)</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-chart-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconUpload className="size-3" />
                  Choose file
                </div>
              </Button>
            </div>
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
              <p className="mt-0.5 text-xs text-muted-foreground">Accepts .json or .csv</p>
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
