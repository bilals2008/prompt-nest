import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingState } from "@/components/loading-state"
import {
  IconDatabase,
  IconInfoCircle,
  IconMoon,
  IconSun,
  IconDeviceLaptop,
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
import { Settings as SettingsIcon, Check, Copy, CheckCheck } from "lucide-react"
import { APP_VERSION } from "@/lib/version"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    window.db.getDatabaseStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
    window.electronAPI?.getAutoStart?.().then(setAutoStart).catch(() => {})
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
    { id: "light", icon: IconSun, label: "Light" },
    { id: "dark", icon: IconMoon, label: "Dark" },
    { id: "system", icon: IconDeviceLaptop, label: "System" },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <SettingsIcon className="size-4" />
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
                          "inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
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
                <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                  <SettingRow icon={IconMoon} label="Theme">
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon
                        const active = theme === opt.id
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <Icon className="size-3.5" />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </SettingRow>
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
                          {copied ? <CheckCheck className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
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
                        <><Check className="size-3" /> Done</>
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
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">About</h2>
                  <p className="text-xs text-muted-foreground">Application information</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Prompt Nest</p>
                        <p className="text-xs text-muted-foreground">{APP_VERSION}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-normal">Electron</Badge>
                      <Badge variant="secondary" className="text-[10px] font-normal">React</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-[11px] text-muted-foreground">
                  Prompt Nest &copy; {new Date().getFullYear()}
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
