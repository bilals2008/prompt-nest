import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  IconFileCode,
  IconFileDescription,
  IconFileTypeTxt,
  IconDownload,
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconFileImport,
  IconHistory,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"

const exportFormats = [
  { id: "json", label: "JSON", icon: IconFileCode, desc: "Full backup with prompts and collections", color: "text-chart-4 bg-chart-4/10" },
  { id: "markdown", label: "Markdown", icon: IconFileDescription, desc: "Readable document format (.md)", color: "text-chart-2 bg-chart-2/10" },
  { id: "txt", label: "Plain Text", icon: IconFileTypeTxt, desc: "Simple text format (.txt)", color: "text-muted-foreground bg-muted" },
]

export default function ExportImport() {
  const [exporting, setExporting] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleExport = async (format) => {
    setExporting(format)
    setResult(null)
    try {
      const res = await window.db.exportData(format)
      if (res.canceled) {
        setExporting(null)
        return
      }
      if (res.success) {
        setResult({ type: "success", message: `Exported successfully`, detail: res.filePath })
        toast.success(`Exported as ${format.toUpperCase()}`)
      }
    } catch (err) {
      setResult({ type: "error", message: "Export failed", detail: err.message })
      toast.error("Export failed")
    }
    setExporting(null)
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
      }
    } catch (err) {
      setResult({ type: "error", message: "Import failed", detail: err.message })
      toast.error("Import failed")
    }
    setImporting(false)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <Download className="size-5" />
          Export / Import
        </h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          {result && (
            <div className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3",
              result.type === "success" ? "border-chart-2/30 bg-chart-2/5" : "border-destructive/30 bg-destructive/5"
            )}>
              {result.type === "success" ? (
                <IconCheck className="mt-0.5 size-4 text-chart-2" />
              ) : (
                <IconAlertCircle className="mt-0.5 size-4 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">{result.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground break-all">{result.detail}</p>
              </div>
            </div>
          )}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconDownload className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Export</h2>
                <p className="text-xs text-muted-foreground">Export all prompts and collections to your preferred format</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {exportFormats.map((fmt) => {
                const Icon = fmt.icon
                const isLoading = exporting === fmt.id
                return (
                  <button
                    key={fmt.id}
                    onClick={() => handleExport(fmt.id)}
                    disabled={exporting !== null}
                    className={cn(
                      "group flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:ring-1 hover:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className={cn("flex size-10 items-center justify-center rounded-xl", fmt.color)}>
                      {isLoading ? (
                        <IconRefresh className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{fmt.label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{fmt.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <IconDownload className="size-3" />
                      Export {fmt.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                <IconUpload className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Import</h2>
                <p className="text-xs text-muted-foreground">Restore from a JSON backup or bulk import prompts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:ring-1 hover:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                  {importing ? (
                    <IconRefresh className="size-5 animate-spin" />
                  ) : (
                    <IconFileImport className="size-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Restore Backup</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Import from a previously exported JSON backup</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-chart-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconUpload className="size-3" />
                  Choose file
                </div>
              </button>

              <div className="flex cursor-not-allowed flex-col gap-3 rounded-xl border border-dashed border-border bg-card/30 p-5 opacity-50">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <IconHistory className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Bulk Import CSV</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Import multiple prompts from a CSV file</p>
                </div>
                <Badge variant="secondary" className="self-start text-[10px] font-normal">Coming Soon</Badge>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
