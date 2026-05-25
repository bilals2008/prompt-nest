// File: src/pages/Dashboard.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardCard } from "@/components/dashboard-card"
import { StatCard } from "@/components/ui/stat-card"
import { TagBadge } from "@/components/tag-badge"
import { Badge } from "@/components/ui/badge"
import { APP_VERSION } from "@/lib/version"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LoadingState, EmptyState } from "@/components/loading-state"
import {
  IconHistory, IconFileDescription, IconChevronRight,
  IconPlus, IconLibrary, IconHeart, IconFolderOpen,
  IconSearch, IconClock, IconDownload, IconFileText,
  IconLayoutDashboard, IconFiles, IconGitFork, IconBolt, IconSettings,
} from "@tabler/icons-react"

const cards = [
  { icon: IconPlus, title: "New Prompt", accent: "primary", description: "Create a new prompt", path: "/prompts/new" },
  { icon: IconLibrary, title: "Prompt Library", accent: "blue", description: "Browse all prompts", path: "/prompts" },
  { icon: IconHeart, title: "Favorites", accent: "yellow", description: "Your saved prompts", path: "/favorites" },
  { icon: IconFolderOpen, title: "Collections", accent: "purple", description: "Organized groups", path: "/collections" },
  { icon: IconSearch, title: "Search Prompts", accent: "green", description: "Find anything", path: "/search" },
  { icon: IconClock, title: "Recent Activity", accent: "orange", description: "Latest changes", path: "/activity" },
  { icon: IconDownload, title: "Export Prompts", accent: "muted", description: "Download as file", path: "/export" },
  { icon: IconFileText, title: "Templates", accent: "primary", description: "Starter templates", path: "/templates" },
  { icon: IconSettings, title: "Settings", accent: "primary", description: "Configure app", path: "/settings" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState([])
  const [stats, setStats] = useState({ totalPrompts: 0, collections: 0, totalTemplates: 0, thisWeek: 0, prevWeekPrompts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.db.getAllPrompts().then((data) => Array.isArray(data) ? data.slice(0, 5) : []),
      window.db.getDashboardStats().then((s) => s || {}),
    ]).then(([p, s]) => {
      setPrompts(p)
      setStats(s)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const weekDiff = stats.thisWeek - stats.prevWeekPrompts
  const promptTrend = weekDiff !== 0 ? `${weekDiff > 0 ? "+" : ""}${weekDiff} vs last week` : undefined

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <IconLayoutDashboard className="size-5" />
          Dashboard
        </h1>
        <Badge variant="secondary" className="font-normal">v{APP_VERSION}</Badge>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto mb-6 grid max-w-6xl grid-cols-4 gap-4">
          <StatCard label="Total Prompts" value={String(stats.totalPrompts)} icon={IconFiles} accent="blue" size="md" trend={promptTrend} desc="All prompts in your library" />
          <StatCard label="Templates" value={String(stats.totalTemplates)} icon={IconFileText} accent="primary" size="md" desc="Reusable prompt blueprints" />
          <StatCard label="Collections" value={String(stats.collections)} icon={IconGitFork} accent="purple" size="md" desc="Organized prompt groups" />
          <StatCard label="This Week" value={String(stats.thisWeek)} icon={IconBolt} accent="orange" size="md" desc="New prompts added this week" />
        </div>

        <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <DashboardCard key={card.title} {...card} onClick={() => navigate(card.path)} />
          ))}
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <IconHistory className="size-4 text-primary" />
              Recent Prompts
            </h2>
            <button
              onClick={() => navigate("/prompts")}
              className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <IconChevronRight className="size-3.5" />
            </button>
          </div>

          {loading ? (
            <LoadingState message="Loading prompts..." />
          ) : prompts.length === 0 ? (
            <EmptyState title="No prompts yet" description="Create your first prompt to get started" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt) => (
                <Card key={prompt.id} size="sm" className="group cursor-pointer transition-all hover:ring-1 hover:ring-primary/30">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconFileDescription className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm">{prompt.title}</CardTitle>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{prompt.content}</p>
                    </div>
                    {prompt.favorite ? (
                      <IconHeart className="size-3.5 fill-chart-3 text-chart-3" />
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1.5 pt-0">
                    {prompt.tags?.split(",").map((tag) => (
                      <TagBadge key={tag.trim()} tag={tag.trim()} />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
