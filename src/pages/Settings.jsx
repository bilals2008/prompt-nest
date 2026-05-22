import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  IconSettings,
  IconDatabase,
  IconInfoCircle,
  IconMoon,
  IconSun,
  IconDeviceLaptop,
  IconFileExport,
  IconAlertTriangle,
  IconRefresh,
  IconFolderOpen,
} from "@tabler/icons-react"
import { Settings as SettingsIcon } from "lucide-react"
import { useTheme } from "next-themes"

function formatSize(bytes) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.db.getDatabaseStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const themeOptions = [
    { id: "light", icon: IconSun, label: "Light" },
    { id: "dark", icon: IconMoon, label: "Dark" },
    { id: "system", icon: IconDeviceLaptop, label: "System" },
  ]

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <SettingsIcon className="size-4" />
          Settings
        </h1>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-6 p-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <IconMoon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Appearance</h2>
            </div>
            <div className="flex gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const active = theme === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </section>

          <Separator />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <IconDatabase className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Database</h2>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconRefresh className="size-3.5 animate-spin" />
                Loading stats...
              </div>
            ) : stats ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-lg font-bold">{stats.prompts}</p>
                    <p className="text-xs text-muted-foreground">Prompts</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-lg font-bold">{stats.collections}</p>
                    <p className="text-xs text-muted-foreground">Collections</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-lg font-bold">{stats.favorites}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Storage</p>
                      <p className="text-xs text-muted-foreground">{formatSize(stats.size)}</p>
                    </div>
                    <IconDatabase className="size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">Location</p>
                      <p className="truncate text-xs text-muted-foreground">{stats.path}</p>
                    </div>
                    <IconFolderOpen className="ml-2 size-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Failed to load stats</p>
            )}
          </section>

          <Separator />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <IconInfoCircle className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">About</h2>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Prompt Nest</p>
                  <p className="text-xs text-muted-foreground">v1.0.0</p>
                </div>
                <Badge variant="secondary" className="text-[10px] font-normal">Electron</Badge>
              </div>
            </div>
          </section>

          <div className="pb-4 text-center text-[11px] text-muted-foreground">
            Prompt Nest &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  )
}
