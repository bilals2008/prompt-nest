import { APP_VERSION, APP_NAME } from "@/lib/version"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconHistory,
  IconRocket,
  IconListCheck,
  IconStar,
  IconCode,
} from "@tabler/icons-react"
import { FileText, GitCommit, Megaphone, Trash2, Sparkles, Search as SearchIcon, Variable, Hash } from "lucide-react"

const comingSoon = [
  { icon: Trash2, label: "Trash / Soft Delete", desc: "Deleted prompts go to trash, restore anytime" },
  { icon: GitCommit, label: "Batch Select & Actions", desc: "Multi-select prompts to delete, move, or favorite in bulk" },
  { icon: FileText, label: "Markdown Preview", desc: "Live preview tab in the prompt editor" },
  { icon: Megaphone, label: "Auto-Save Drafts", desc: "Editor auto-saves so you never lose changes" },
  { icon: Sparkles, label: "Prompt Stats", desc: "Per-prompt copy count, edit count, view count" },
  { icon: Hash, label: "Tag Management", desc: "Merge, rename, and delete tags" },
  { icon: SearchIcon, label: "Global Search (Cmd+K)", desc: "Quick search overlay from anywhere" },
  { icon: Variable, label: "Prompt Variables", desc: "Use {{variable}} placeholders in prompts" },
]

const changelog = [
  {
    version: "0.0.1-beta",
    date: "May 2026",
    type: "alpha",
    changes: [
      "Initial beta release",
      "Create, edit, and delete prompts",
      "Organize prompts with collections",
      "Mark prompts as favorites",
      "Full-text search across prompts",
      "Export / Import prompts (JSON, Markdown, TXT)",
      "Activity tracking with timeline view",
      "Templates — save and reuse prompt blueprints",
      "Dark / Light / System theme support",
      "Activity dashboard with charts (daily bar, donut, weekly trend)",
      "Toast notifications across all actions",
    ],
  },
]

function VersionBadge({ type }) {
  const styles = {
    alpha: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    beta: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    release: "bg-primary/10 text-primary border-primary/20",
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[type] || styles.alpha}`}>
      {type}
    </span>
  )
}

export default function Changelog() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <IconHistory className="size-4" />
          Changelog
        </h1>
        <Badge variant="secondary" className="gap-1.5 font-normal">
          <IconCode className="size-3" />
          {APP_VERSION}
        </Badge>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                <IconRocket className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Coming Soon</h2>
                <p className="text-xs text-muted-foreground">Planned features for upcoming releases</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-background/50 p-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {changelog.map((release) => (
            <div key={release.version}>
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconStar className="size-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{release.version}</h3>
                    <VersionBadge type={release.type} />
                  </div>
                  <p className="text-xs text-muted-foreground">{release.date}</p>
                </div>
              </div>

              <div className="ml-10 space-y-0.5">
                {release.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/30">
                    <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconListCheck className="size-2.5" />
                    </div>
                    <span className="text-sm text-muted-foreground">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pb-6 text-center text-xs text-muted-foreground">
            {APP_NAME} &copy; {new Date().getFullYear()}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
