import { useState, useEffect, useRef } from "react"
import Markdown from "react-markdown"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconLoader2, IconDownload, IconRefresh, IconCheck } from "@tabler/icons-react"

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond === 0) return ""
  return `${formatBytes(bytesPerSecond)}/s`
}

function stripHtml(text) {
  if (!text || !text.includes("<")) return text
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatDate(dateStr) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function UpdateDialog({ open, onOpenChange }) {
  const [state, setState] = useState({
    currentVersion: "",
    latestVersion: "",
    releaseDate: "",
    fileSize: 0,
    releaseNotes: "",
    downloadProgress: 0,
    downloadSpeed: 0,
    totalBytes: 0,
    transferredBytes: 0,
    isDownloading: false,
    isReadyToInstall: false,
    isChecking: true,
    updateAvailable: false,
    checkFailed: false,
    errorMessage: "",
    isDemo: false,
    updateType: "full",
  })

  const speedCalcRef = useRef({ lastBytes: 0, lastTime: 0 })

  function startDemo() {
    setState((s) => ({
      ...s,
      isChecking: true,
      updateAvailable: false,
      checkFailed: false,
      errorMessage: "",
      isDemo: true,
      currentVersion: "0.0.5-beta",
      latestVersion: "0.0.6-beta",
      releaseDate: "2026-05-24T10:00:00.000Z",
      releaseNotes: "- Performance improvements\n- Bug fixes",
      totalBytes: 52428800,
      updateType: "full",
    }))
    setTimeout(() => {
      setState((s) => ({ ...s, isChecking: false, updateAvailable: true }))
    }, 1000)
  }

  useEffect(() => {
    if (!open) return
    const api = window.electronAPI
    if (!api?.updater) {
      setState((s) => ({ ...s, isChecking: false, checkFailed: true, errorMessage: "Updater not available" }))
      return
    }

    setState((s) => ({
      ...s,
      releaseNotes: "",
      downloadProgress: 0,
      downloadSpeed: 0,
      totalBytes: 0,
      transferredBytes: 0,
      isDownloading: false,
      isReadyToInstall: false,
      isChecking: true,
      updateAvailable: false,
      checkFailed: false,
      errorMessage: "",
    }))

    speedCalcRef.current = { lastBytes: 0, lastTime: 0 }

    api.updater.getAppVersion().then((version) => {
      setState((s) => ({ ...s, currentVersion: version || "" }))
    })

    const cleanup = api.onUpdaterEvent(({ type, payload }) => {
      switch (type) {
        case "checking-for-update":
          setState((s) => ({ ...s, isChecking: true }))
          break
        case "update-available":
          setState((s) => ({
            ...s,
            isChecking: false,
            updateAvailable: true,
            latestVersion: payload.version,
            releaseDate: payload.releaseDate,
            releaseNotes: stripHtml(payload.releaseNotes || ""),
            totalBytes: payload.total || 0,
            updateType: payload.updateType || "full",
          }))
          break
        case "update-not-available":
          setState((s) => ({
            ...s,
            isChecking: false,
            updateAvailable: false,
          }))
          break
        case "download-progress":
          setState((s) => {
            const now = Date.now()
            const ref = speedCalcRef.current
            let speed = payload.bytesPerSecond || 0
            if (ref.lastTime && ref.lastBytes > 0) {
              const elapsed = (now - ref.lastTime) / 1000
              if (elapsed > 0) {
                speed = Math.round((payload.transferred - ref.lastBytes) / elapsed)
              }
            }
            ref.lastBytes = payload.transferred || 0
            ref.lastTime = now
            return {
              ...s,
              downloadProgress: Math.round(payload.percent),
              downloadSpeed: speed,
              totalBytes: payload.total || 0,
              transferredBytes: payload.transferred || 0,
              isDownloading: true,
            }
          })
          break
        case "update-downloaded":
          setState((s) => ({
            ...s,
            downloadProgress: 100,
            isDownloading: false,
            isReadyToInstall: true,
          }))
          break
        case "error":
          setState((s) => ({
            ...s,
            isChecking: false,
            checkFailed: !s.isReadyToInstall,
            errorMessage: s.isReadyToInstall ? "" : payload.message,
          }))
          break
      }
    })

    api.updater.checkForUpdates()

    return () => {
      if (typeof cleanup === "function") cleanup()
    }
  }, [open])

  const handleDownload = async () => {
    if (state.isDemo) return
    speedCalcRef.current = { lastBytes: 0, lastTime: 0 }
    await window.electronAPI?.updater?.downloadUpdate()
  }

  const handleInstall = () => {
    window.electronAPI?.updater?.quitAndInstall()
  }

  const handleRetry = () => {
    if (state.isDemo) { startDemo(); return }
    setState((s) => ({
      ...s,
      isChecking: true,
      checkFailed: false,
      errorMessage: "",
    }))
    window.electronAPI?.updater?.checkForUpdates()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check for Updates</DialogTitle>
          <DialogDescription>
            {state.currentVersion && `Current version: ${state.currentVersion}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {state.isChecking && (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <IconLoader2 className="size-6 animate-spin" />
              <span className="text-sm">Checking for updates...</span>
            </div>
          )}

          {state.checkFailed && !state.isReadyToInstall && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <IconRefresh className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Unable to check for updates</p>
                {state.errorMessage && (
                  <p className="mt-1 text-xs text-muted-foreground">{state.errorMessage}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <IconRefresh className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {!state.isChecking && !state.checkFailed && !state.updateAvailable && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <IconCheck className="size-8 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">You&apos;re up to date</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.currentVersion} is the latest version.
                </p>
              </div>
            </div>
          )}

          {state.updateAvailable && !state.isReadyToInstall && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                    {state.currentVersion}
                  </span>
                </div>
                <IconDownload className="size-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">New</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                    {state.latestVersion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {state.releaseDate && (
                  <p className="text-xs text-muted-foreground">
                    Released: {formatDate(state.releaseDate)}
                  </p>
                )}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${state.updateType === "patch" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                  {state.updateType === "patch" ? "Quick Patch" : "Full Installer"}
                </span>
              </div>

              {state.releaseNotes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">What&apos;s New</p>
                  <div className="prose prose-xs max-w-none text-xs text-muted-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_p]:my-1">
                    <Markdown>{state.releaseNotes}</Markdown>
                  </div>
                </div>
              )}

              {!state.isDownloading && (
                <Button className="w-full" onClick={handleDownload}>
                  <IconDownload className="size-4" />
                  {state.updateType === "patch"
                    ? `Download Patch${state.totalBytes ? ` (${formatBytes(state.totalBytes)})` : ""}`
                    : `Download Update${state.totalBytes ? ` (${formatBytes(state.totalBytes)})` : ""}`}
                </Button>
              )}

              {state.isDownloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Downloading...</span>
                    <span className="text-muted-foreground">{state.downloadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${state.downloadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatBytes(state.transferredBytes)} / {formatBytes(state.totalBytes)}
                    </span>
                    <span>{formatSpeed(state.downloadSpeed)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {state.isReadyToInstall && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <IconCheck className="size-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Update Ready to Install
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Restart the app to apply the update.
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={handleInstall}>
                Install & Restart
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {import.meta.env.DEV && !state.isDemo && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={startDemo}>
              Demo Mode
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function useUpdateStatus() {
  const [state, setState] = useState({
    updateAvailable: false,
    latestVersion: "",
    isChecking: true,
    currentVersion: "",
  })

  useEffect(() => {
    const api = window.electronAPI
    if (!api?.updater) {
      setState((s) => ({ ...s, isChecking: false }))
      return
    }

    const cleanup = api.onUpdaterEvent(({ type, payload }) => {
      switch (type) {
        case "update-available":
          setState((s) => ({
            ...s,
            updateAvailable: true,
            latestVersion: payload.version,
            isChecking: false,
          }))
          break
        case "checking-for-update":
          break
        case "update-not-available":
          setState((s) => ({ ...s, updateAvailable: false, isChecking: false }))
          break
        case "error":
          setState((s) => ({ ...s, isChecking: false }))
          break
      }
    })

    api.updater.checkForUpdates()

    return () => {
      if (typeof cleanup === "function") cleanup()
    }
  }, [])

  return state
}
