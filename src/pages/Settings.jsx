// File: src/pages/Settings.jsx
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
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
  IconLayoutGrid,
  IconPower,
  IconPlayerRecord,
  IconSettings,
  IconCheck,
  IconCopy,
  IconChecks,
  IconBell,
  IconEdit,
  IconClock,
  IconAlertTriangle,
  IconHistory,
} from "@tabler/icons-react"
import { toast } from "sonner"
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
  { id: "editor", icon: IconEdit, label: "Editor" },
  { id: "notifications", icon: IconBell, label: "Notifications" },
  { id: "database", icon: IconDatabase, label: "Database" },
  { id: "shortcuts", icon: IconKeyboard, label: "Shortcuts" },
  { id: "about", icon: IconInfoCircle, label: "About" },
]

const shortcuts = [
  { keys: ["Ctrl", "B"], label: "Toggle sidebar" },
  { keys: ["Ctrl", "N"], label: "New prompt" },
  { keys: ["Ctrl", "E"], label: "Export" },
  { keys: ["Ctrl", "S"], label: "Save prompt" },
  { keys: ["Ctrl", "D"], label: "Toggle favorite" },
  { keys: ["Ctrl", "Alt", "P"], label: "Global search (Spotlight)" },
]

const DEFAULT_SETTINGS = {
  defaultView: "dashboard",
  autoSave: "false",
  autoSaveDelay: "10",
  confirmDelete: "true",
  compactMode: "false",
  fontSize: "large",
  editorMode: "simple",
  showLineNumbers: "false",
  spellCheck: "true",
  updateNotifications: "true",
  backupReminders: "false",
  backupInterval: "14",
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

function ToggleSetting({ icon: Icon, label, description, checked, onChange }) {
  return (
    <SettingRow icon={Icon} label={label} description={description}>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          onChange(v)
          toast.info(`${label} ${v ? "enabled" : "disabled"}`)
        }}
      />
    </SettingRow>
  )
}

function SelectSetting({ icon: Icon, label, description, value, onChange, children }) {
  return (
    <SettingRow icon={Icon} label={label} description={description}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </SettingRow>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("general")
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backupStatus, setBackupStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [aboutData, setAboutData] = useState({ versions: null, uptime: 0, sessionCount: 0, lastBackup: null, totalActivity: 0, diskFree: 0 })

  const loadSettings = useCallback(async () => {
    try {
      const loaded = {}
      for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        const value = await window.db.getSetting(key)
        loaded[key] = value ?? defaultValue
      }
      setSettings(loaded)
    } catch {
      // keep defaults
    }
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    try {
      await window.db.setSetting(key, value)
      window.dispatchEvent(new CustomEvent("setting-changed", { detail: { key, value } }))
    } catch {
      toast.error("Failed to save setting")
    }
  }, [])

  useEffect(() => {
    window.db.getDatabaseStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
    window.electronAPI?.getAutoStart?.().then(setAutoStart).catch(() => {})
    loadSettings()
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
  }, [loadSettings])

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

  const themeGroups = [
    {
      label: "Light",
      themes: [
        {
          id: "light",
          label: "Light",
          desc: "Clean and bright",
          bg: "#ffffff",
          card: "#f1f5f9",
          accent: "#6366f1",
          text: "#0f1729",
        },
        {
          id: "amber",
          label: "Amber",
          desc: "Warm golden tones",
          bg: "#fffbeb",
          card: "#fef3c7",
          accent: "#f59e0b",
          text: "#451a03",
        },
        {
          id: "sage",
          label: "Sage",
          desc: "Calming forest-gray tones",
          bg: "#f4f7f5",
          card: "#ffffff",
          accent: "#2d6a4f",
          text: "#1c2e24",
        },
      ],
    },
    {
      label: "Dark",
      themes: [
        {
          id: "dark",
          label: "Dark",
          desc: "Easy on the eyes",
          bg: "#0c0c14",
          card: "#161e34",
          accent: "#6366f1",
          text: "#ededee",
        },
        {
          id: "forest",
          label: "Forest",
          desc: "Natural green tones",
          bg: "#0d1a0d",
          card: "#142414",
          accent: "#4ade80",
          text: "#e2f0e2",
        },
        {
          id: "ocean",
          label: "Ocean",
          desc: "Deep blue vibes",
          bg: "#0a1628",
          card: "#12203a",
          accent: "#38bdf8",
          text: "#dce8f5",
        },
        {
          id: "midnight",
          label: "Midnight",
          desc: "Deep purple vibes",
          bg: "#0e0a1a",
          card: "#1a1430",
          accent: "#a78bfa",
          text: "#e8e0f0",
        },
        {
          id: "rose",
          label: "Rose",
          desc: "Soft editorial red",
          bg: "#1b0f16",
          card: "#281720",
          accent: "#fb7185",
          text: "#f4e7ec",
        },
        {
          id: "mocha",
          label: "Mocha",
          desc: "Warm focused brown",
          bg: "#17120f",
          card: "#241b16",
          accent: "#d6a15f",
          text: "#f0e7dc",
        },
        {
          id: "read",
          label: "Read",
          desc: "Warm reading tones",
          bg: "#1c1816",
          card: "#2a2420",
          accent: "#b8976a",
          text: "#e6ddd0",
        },
        {
          id: "sunset",
          label: "Sunset",
          desc: "Warm orange glow",
          bg: "#1a0f14",
          card: "#2a1a22",
          accent: "#f97316",
          text: "#f5e6d8",
        },
        {
          id: "lavender",
          label: "Lavender",
          desc: "Soft purple hues",
          bg: "#12111a",
          card: "#1e1d2a",
          accent: "#a78bfa",
          text: "#e8e4f0",
        },
        {
          id: "nord",
          label: "Nord",
          desc: "Arctic blue tones",
          bg: "#1a1f2e",
          card: "#242a3a",
          accent: "#88c0d0",
          text: "#d8dee9",
        },
        {
          id: "dracula",
          label: "Dracula",
          desc: "Classic dark palette",
          bg: "#1e1f29",
          card: "#282a36",
          accent: "#ff79c6",
          text: "#f8f8f2",
        },
        {
          id: "catppuccin",
          label: "Catppuccin",
          desc: "Pastel comfort tones",
          bg: "#1e1e2e",
          card: "#313244",
          accent: "#cba6f7",
          text: "#cdd6f4",
        },
        {
          id: "tokyonight",
          label: "Tokyo Night",
          desc: "Neon city vibes",
          bg: "#1a1b26",
          card: "#24283b",
          accent: "#7aa2f7",
          text: "#c0caf5",
        },
        {
          id: "minimal",
          label: "Minimal",
          desc: "Pure dark simplicity",
          bg: "#111111",
          card: "#1a1a1a",
          accent: "#ffffff",
          text: "#e5e5e5",
        },
        {
          id: "cyberpunk",
          label: "Cyberpunk",
          desc: "Neon futuristic glow",
          bg: "#06060c",
          card: "#0c0c16",
          accent: "#00f0ff",
          text: "#e2e2f5",
          secondaryAccent: "#ff2a9d",
        },
      ],
    },
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
                  <SelectSetting
                    icon={IconPlayerRecord}
                    label="Default view on startup"
                    description="Choose which screen opens when the app launches"
                    value={settings.defaultView}
                    onChange={(v) => updateSetting("defaultView", v)}
                  >
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="prompts">Prompt Library</SelectItem>
                    <SelectItem value="last">Last viewed</SelectItem>
                  </SelectSetting>

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconPower}
                    label="Start on system boot"
                    description="Launch app automatically when you log in"
                    checked={autoStart}
                    onChange={handleAutoStart}
                  />

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconPlayerPlay}
                    label="Auto-save prompts"
                    description="Automatically save changes while editing"
                    checked={settings.autoSave === "true"}
                    onChange={(v) => updateSetting("autoSave", String(v))}
                  />

                  {settings.autoSave === "true" && (
                    <>
                      <Separator className="my-1" />
                      <SelectSetting
                        icon={IconClock}
                        label="Auto-save delay"
                        description="How long to wait before saving"
                        value={settings.autoSaveDelay}
                        onChange={(v) => updateSetting("autoSaveDelay", v)}
                      >
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                      </SelectSetting>
                    </>
                  )}

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconAlertTriangle}
                    label="Confirm before delete"
                    description="Show a confirmation dialog before deleting items"
                    checked={settings.confirmDelete === "true"}
                    onChange={(v) => updateSetting("confirmDelete", String(v))}
                  />
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                  <p className="text-xs text-muted-foreground">Customize the look and feel</p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 mb-5">
                  <ToggleSetting
                    icon={IconLayoutGrid}
                    label="Compact mode"
                    description="Reduce spacing and visual density"
                    checked={settings.compactMode === "true"}
                    onChange={(v) => updateSetting("compactMode", String(v))}
                  />
                  <Separator className="my-1" />
                  <SelectSetting
                    icon={IconMoon}
                    label="Font size"
                    description="Adjust the base text size across the app"
                    value={settings.fontSize}
                    onChange={(v) => updateSetting("fontSize", v)}
                  >
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectSetting>
                </div>

                <div className="space-y-5">
                  {themeGroups.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{group.label}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {group.themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id)
                              toast.success(`${t.label} theme applied`)
                            }}
                            className={cn(
                              "group relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer",
                              theme === t.id
                                ? "border-primary shadow-sm"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            {theme === t.id && (
                              <div className="absolute top-3 right-3 flex items-center justify-center size-5 rounded-full bg-primary">
                                <IconCheck size={12} className="text-primary-foreground" />
                              </div>
                            )}
                            <div
                              className="rounded-lg border overflow-hidden mb-3"
                              style={{ borderColor: t.card }}
                            >
                              <div style={{ background: t.bg, padding: "12px" }}>
                                <div
                                  className="h-2 w-16 rounded-full mb-2"
                                  style={{ background: t.accent }}
                                />
                                <div
                                  className="h-1.5 w-24 rounded-full mb-1.5 opacity-40"
                                  style={{ background: t.text }}
                                />
                                <div
                                  className="rounded p-2 flex gap-1.5"
                                  style={{ background: t.card }}
                                >
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: t.accent }}
                                  />
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: t.secondaryAccent || t.accent, opacity: t.secondaryAccent ? 1 : 0.3 }}
                                  />
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: t.text, opacity: 0.3 }}
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-foreground">{t.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "editor" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">Editor</h2>
                  <p className="text-xs text-muted-foreground">Configure the prompt editor behavior</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <SelectSetting
                    icon={IconEdit}
                    label="Default editor mode"
                    description="Choose how prompts are edited by default"
                    value={settings.editorMode}
                    onChange={(v) => updateSetting("editorMode", v)}
                  >
                    <SelectItem value="simple">Simple text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="split">Split view</SelectItem>
                  </SelectSetting>

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconLayoutGrid}
                    label="Show line numbers"
                    description="Display line numbers in the editor"
                    checked={settings.showLineNumbers === "true"}
                    onChange={(v) => updateSetting("showLineNumbers", String(v))}
                  />

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconPlayerRecord}
                    label="Spell check"
                    description="Enable spell checking in the editor"
                    checked={settings.spellCheck === "true"}
                    onChange={(v) => updateSetting("spellCheck", String(v))}
                  />
                </div>
              </section>
            )}

            {activeSection === "notifications" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  <p className="text-xs text-muted-foreground">Control what you get notified about</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <ToggleSetting
                    icon={IconBell}
                    label="Update notifications"
                    description="Get notified when a new version is available"
                    checked={settings.updateNotifications === "true"}
                    onChange={(v) => updateSetting("updateNotifications", String(v))}
                  />

                  <Separator className="my-1" />

                  <ToggleSetting
                    icon={IconDatabase}
                    label="Backup reminders"
                    description="Remind you to back up your database periodically"
                    checked={settings.backupReminders === "true"}
                    onChange={(v) => updateSetting("backupReminders", String(v))}
                  />

                  {settings.backupReminders === "true" && (
                    <>
                      <Separator className="my-1" />
                      <SelectSetting
                        icon={IconClock}
                        label="Backup reminder interval"
                        description="How often to remind you to back up"
                        value={settings.backupInterval}
                        onChange={(v) => updateSetting("backupInterval", v)}
                      >
                        <SelectItem value="7">Every 7 days</SelectItem>
                        <SelectItem value="14">Every 14 days</SelectItem>
                        <SelectItem value="30">Every 30 days</SelectItem>
                      </SelectSetting>
                    </>
                  )}
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
                      <button onClick={() => navigate("/changelog")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-all no-underline cursor-pointer">
                        <IconHistory className="size-4" />
                        Changelog
                      </button>
                      <a href="https://github.com/bilals2008/prompt-nest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-all no-underline">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        View on GitHub
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
                  <p>Built by <span className="font-medium text-foreground">Muhammad Bilal Hassan</span></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => window.electronAPI.openExternal('https://github.com/bilals2008')} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent cursor-pointer" aria-label="GitHub">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    </button>
                    <button onClick={() => window.electronAPI.openExternal('https://x.com/MBilal7555')} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent cursor-pointer" aria-label="X">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                    <button onClick={() => window.electronAPI.openExternal('https://www.linkedin.com/in/muhammad-bilal-hassan-327209414')} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent cursor-pointer" aria-label="LinkedIn">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </button>
                    <button onClick={() => window.electronAPI.openExternal('https://youtube.com/@BilalHassan-75')} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent cursor-pointer" aria-label="YouTube">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </button>
                    <button onClick={() => window.electronAPI.openExternal('https://discord.gg/bilaldevelpor_00328')} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent cursor-pointer" aria-label="Discord">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                    </button>
                  </div>
                  <p>Prompt Nest &copy; {new Date().getFullYear()}</p>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
