// File: src/pages/Settings.jsx
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingState } from "@/components/loading-state"
import {
  IconDatabase,
  IconInfoCircle,
  IconMoon,
  IconFolderOpen,
  IconRefresh,
  IconFileExport,
  IconKeyboard,
  IconPlayerPlay,
  IconSparkles,
  IconLayoutGrid,
  IconPower,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { IconSettings, IconCheck, IconCopy, IconChecks } from "@tabler/icons-react"
import { APP_VERSION } from "@/lib/version"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

function formatUptime(ms) {
  if (!ms) return "-"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const sections = [
  { id: "general", icon: IconPlayerPlay, label: "General" },
  { id: "appearance", icon: IconMoon, label: "Appearance" },
  { id: "database", icon: IconDatabase, label: "Database" },
  { id: "shortcuts", icon: IconKeyboard, label: "Shortcuts" },
  { id: "about", icon: IconInfoCircle, label: "About" },
]

const shortcuts = [
  { keys: ["Ctrl", "B"], label: "Toggle sidebar" },
  { keys: ["Ctrl", "K"], label: "Quick search" },
  { keys: ["Ctrl", "N"], label: "New prompt" },
  { keys: ["Ctrl", "E"], label: "Export" },
  { keys: ["Ctrl", "S"], label: "Save prompt" },
  { keys: ["Ctrl", "D"], label: "Toggle favorite" },
]

function ComingSoon() {
  return (
    <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground tracking-wide cursor-default">
      Coming soon
    </span>
  )
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState("general")
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backupStatus, setBackupStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const [aboutData, setAboutData] = useState({ versions: null, uptime: 0, sessionCount: 0, lastBackup: null, totalActivity: 0, diskFree: 0 })

  useEffect(() => {
    window.db.getDatabaseStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
    window.electronAPI?.getAutoStart?.().then(setAutoStart).catch(() => {})
    Promise.all([
      window.electronAPI?.getVersions?.(),
      window.electronAPI?.getUptime?.(),
      window.electronAPI?.getSessionCount?.(),
      window.electronAPI?.getLastBackup?.(),
      window.electronAPI?.getTotalActivity?.(),
      window.electronAPI?.getDiskFree?.(),
    ]).then(([versions, uptime, sessionCount, lastBackup, totalActivity, diskFree]) => {
      setAboutData({ versions, uptime, sessionCount, lastBackup, totalActivity, diskFree })
    }).catch(() => {})
  }, [])

  const handleBackup = async () => {
    setBackupStatus("backingup")
    try {
      const result = await window.db.backupDatabase()
      if (result.success) {
        setBackupStatus("success")
        toast.success("Database backed up successfully")
      } else {
        setBackupStatus("error")
        toast.error("Backup failed")
      }
    } catch {
      setBackupStatus("error")
      toast.error("Backup failed")
    }
    setTimeout(() => setBackupStatus(null), 3000)
  }

  const handleAutoStart = async () => {
    const next = !autoStart
    setAutoStart(next)
    await window.electronAPI?.setAutoStart?.(next)
  }

  const handleCopyPath = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Path copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy path")
    }
  }

  const themeOptions = [
    {
      id: "light",
      label: "Light",
      bg: "#ffffff",
      fg: "#0f1729",
      accent: "#6366f1",
    },
    {
      id: "dark",
      label: "Dark",
      bg: "#0c0c14",
      fg: "#ededee",
      accent: "#6366f1",
    },
    {
      id: "forest",
      label: "Forest",
      bg: "#0d1a0d",
      fg: "#e2f0e2",
      accent: "#4ade80",
    },
    {
      id: "ocean",
      label: "Ocean",
      bg: "#0a1628",
      fg: "#dce8f5",
      accent: "#38bdf8",
    },
  ]

  const upcomingThemes = [
    "Midnight", "Sunset", "Lavender", "Rose",
    "Mocha", "Nord", "Dracula", "Catppuccin",
    "Tokyo Night", "Minimal",
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <IconSettings className="size-4" />
          Settings
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-44 shrink-0 border-r border-border bg-card/30 p-3 flex flex-col gap-1">
          {sections.map((section) => (
            <NavItem
              key={section.id}
              icon={section.icon}
              label={section.label}
              active={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </nav>

        <ScrollArea className="flex-1">
          <div className="p-6">

            {activeSection === "general" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">General</h2>
                  <p className="text-xs text-muted-foreground">Application behavior preferences</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <SettingRow
                    icon={IconLayoutGrid}
                    label="Compact mode"
                    description="Reduce spacing and visual density"
                  >
                    <ComingSoon />
                  </SettingRow>
                  <Separator className="my-1" />
                  <SettingRow
                    icon={IconPower}
                    label="Start on system boot"
                    description="Launch app automatically when you log in"
                  >
                    <button
                      onClick={handleAutoStart}
                      className={cn(
                        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                        autoStart ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200",
                          autoStart ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </SettingRow>
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">Appearance</h2>
                  <p className="text-xs text-muted-foreground">Theme, animations, and layout density</p>
                </div>
                <div className="rounded-sm border border-border bg-card p-4 space-y-1">
                  <SettingRow icon={IconMoon} label="Theme">
                    <div className="grid grid-cols-4 gap-3 w-72">
                      {themeOptions.map((opt) => (
                        <Button
                          key={opt.id}
                          variant="outline"
                          onClick={() => {
                            setTheme(opt.id)
                            toast.success(`${opt.label} theme applied`)
                          }}
                          className={cn(
                            "flex items-center justify-center p-0 h-9 transition-all duration-300 ease-out",
                            theme === opt.id && "border-primary ring ring-primary/40"
                          )}
                          style={{ backgroundColor: opt.bg, color: opt.fg }}
                        >
                          <span className="text-xs font-medium">{opt.label}</span>
                        </Button>
                      ))}
                    </div>
                  </SettingRow>
                  <Separator className="my-2" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">More themes coming soon</p>
                    <div className="flex flex-wrap gap-1.5">
                      {upcomingThemes.map((name) => (
                        <span
                          key={name}
                          className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground cursor-default"
                        >
                          {name}
                          <span className="ml-1.5 text-[10px] text-muted-foreground/50">&#8226; Soon</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-1" />
                  <SettingRow
                    icon={IconSparkles}
                    label="Animations"
                    description="Enable transition effects and micro-interactions"
                  >
                    <ComingSoon />
                  </SettingRow>
                  <Separator className="my-1" />
                  <SettingRow
                    icon={IconLayoutGrid}
                    label="Density"
                    description="Content spacing and sizing"
                  >
                    <ComingSoon />
                  </SettingRow>
                </div>
              </section>
            )}

            {activeSection === "database" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">Database</h2>
                  <p className="text-xs text-muted-foreground">Storage stats, backup, and file management</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                  {loading ? (
                    <LoadingState message="Loading stats..." className="py-2" />
                  ) : stats ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="rounded-lg border border-border bg-background p-3">
                          <p className="text-lg font-bold">{stats.prompts}</p>
                          <p className="text-xs text-muted-foreground">Prompts</p>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-3">
                          <p className="text-lg font-bold">{stats.collections}</p>
                          <p className="text-xs text-muted-foreground">Collections</p>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-3">
                          <p className="text-lg font-bold">{stats.favorites}</p>
                          <p className="text-xs text-muted-foreground">Favorites</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">DB Path</p>
                          <p className="truncate text-xs text-muted-foreground">{stats.path}</p>
                        </div>
                        <button
                          onClick={() => handleCopyPath(stats.path)}
                          className="ml-2 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                          title="Copy path"
                        >
                          {copied ? <IconChecks className="size-3.5 text-primary" /> : <IconCopy className="size-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div>
                          <p className="text-xs font-medium">Storage</p>
                          <p className="text-xs text-muted-foreground">{formatSize(stats.size)}</p>
                        </div>
                        <IconDatabase className="size-4 text-muted-foreground" />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">Failed to load stats</p>
                  )}

                  <Separator className="my-1" />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <IconFileExport className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Backup database</p>
                        <p className="text-xs text-muted-foreground">Create a timestamped copy</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBackup}
                      disabled={backupStatus === "backingup"}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                        backupStatus === "success"
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : backupStatus === "error"
                          ? "border-destructive/50 bg-destructive/10 text-destructive"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {backupStatus === "backingup" ? (
                        <><IconRefresh className="size-3 animate-spin" /> Backing up</>
                      ) : backupStatus === "success" ? (
                        <><IconCheck className="size-3" /> Done</>
                      ) : backupStatus === "error" ? (
                        <>Failed</>
                      ) : (
                        <><IconFileExport className="size-3" /> Backup</>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <IconFolderOpen className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Open DB folder</p>
                        <p className="text-xs text-muted-foreground">Reveal in file explorer</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.db.openDbFolder()}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <IconFolderOpen className="size-3" />
                      Open
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "shortcuts" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
                  <p className="text-xs text-muted-foreground">Available keyboard shortcuts for common actions</p>
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  {shortcuts.map((shortcut, i) => (
                    <div
                      key={shortcut.label}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5",
                        i < shortcuts.length - 1 && "border-b border-border"
                      )}
                    >
                      <span className="text-sm">{shortcut.label}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, ki) => (
                          <span key={ki}>
                            <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground shadow-xs">
                              {key}
                            </kbd>
                            {ki < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-xs text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "about" && (
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <IconInfoCircle className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">About</h2>
                    <p className="text-xs text-muted-foreground">Application information</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold">Prompt Nest</p>
                        <p className="text-xs text-muted-foreground">{APP_VERSION}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] font-normal">Electron {aboutData.versions?.electron}</Badge>
                        <Badge variant="secondary" className="text-[10px] font-normal">React</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Prompts", value: stats?.prompts },
                        { label: "Collections", value: stats?.collections },
                        { label: "Session", value: aboutData.sessionCount },
                        { label: "Actions", value: aboutData.totalActivity },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-border bg-background p-2.5 text-center">
                          <p className="text-base font-bold">{item.value ?? "-"}</p>
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <IconFolderOpen className="size-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Storage</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">Database</span>
                        <span className="text-xs font-medium">{stats?.size ? formatSize(stats.size) : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">Free disk space</span>
                        <span className="text-xs font-medium">{aboutData.diskFree ? formatSize(aboutData.diskFree) : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">Uptime</span>
                        <span className="text-xs font-medium">{formatUptime(aboutData.uptime)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">Last backup</span>
                        <span className="text-xs font-medium">{aboutData.lastBackup ? new Date(aboutData.lastBackup).toLocaleDateString() : "Never"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">Data path</span>
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-36 truncate text-xs font-medium">{stats?.path ?? "-"}</span>
                          <button onClick={() => handleCopyPath(stats?.path)} className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer">
                            {copied ? <IconChecks className="size-3 text-primary" /> : <IconCopy className="size-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <IconInfoCircle className="size-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources</span>
                    </div>
                    <div className="space-y-1">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('open-update-dialog'))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-all no-underline cursor-pointer">
                        <IconRefresh className="size-4" />
                        Check for Updates
                      </button>
                      <a href="https://github.com/bilals2008/prompt-nest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-all no-underline">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        View on GitHub
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-1 text-center text-[11px] text-muted-foreground">
                  <p>Prompt Nest &copy; {new Date().getFullYear()}</p>
                  <p>Built by <span className="font-medium text-foreground">Muhammad Bilal Hassan</span></p>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
