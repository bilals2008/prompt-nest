// File: src/pages/Dashboard.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardCard } from "@/components/dashboard-card"
import { StatCard } from "@/components/ui/stat-card"
import { TagBadge } from "@/components/tag-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LoadingState, EmptyState } from "@/components/loading-state"
import { IconHistory, IconFileDescription, IconChevronRight } from "@tabler/icons-react"
import {
  Plus,
  Library,
  Heart,
  FolderOpen,
  Search,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  FileStack,
  Tags,
  GitFork,
  Zap,
  Settings,
} from "lucide-react"

const cards = [
  { icon: Plus, title: "New Prompt", accent: "primary", description: "Create a new prompt", path: "/prompts/new" },
  { icon: Library, title: "Prompt Library", accent: "blue", description: "Browse all prompts", path: "/prompts" },
  { icon: Heart, title: "Favorites", accent: "yellow", description: "Your saved prompts" },
  { icon: FolderOpen, title: "Collections", accent: "purple", description: "Organized groups" },
  { icon: Search, title: "Search Prompts", accent: "green", description: "Find anything" },
  { icon: Clock, title: "Recent Activity", accent: "orange", description: "Latest changes" },
  { icon: Download, title: "Export Prompts", accent: "muted", description: "Download as file" },
  { icon: FileText, title: "Templates", accent: "primary", description: "Starter templates" },
  { icon: Settings, title: "Settings", accent: "primary", description: "Configure app", path: "/settings" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState([])
  const [stats, setStats] = useState({ totalPrompts: 0, collections: 0, totalTemplates: 0, thisWeek: 0 })
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

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <LayoutDashboard className="size-5" />
          Dashboard
        </h1>
        <Badge variant="secondary" className="font-normal">v1.0.0</Badge>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto mb-6 grid max-w-6xl grid-cols-4 gap-4">
          <StatCard label="Total Prompts" value={String(stats.totalPrompts)} icon={FileStack} accent="blue" size="md" />
          <StatCard label="Templates" value={String(stats.totalTemplates)} icon={FileText} accent="primary" size="md" />
          <StatCard label="Collections" value={String(stats.collections)} icon={GitFork} accent="purple" size="md" />
          <StatCard label="This Week" value={String(stats.thisWeek)} icon={Zap} accent="orange" size="md" />
        </div>

        <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <DashboardCard key={card.title} {...card} onClick={card.path ? () => navigate(card.path) : undefined} />
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
                      <Heart className="size-3.5 fill-chart-3 text-chart-3" />
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
