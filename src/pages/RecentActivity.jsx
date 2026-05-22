import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  IconPencil,
  IconCopy,
  IconEye,
  IconClock,
  IconRefresh,
  IconAlertCircle,
  IconArrowRight,
  IconCalendarClock,
  IconChartLine,
  IconTrendingUp,
  IconHistory,
} from "@tabler/icons-react"
import { Clock } from "lucide-react"

const actionConfig = {
  edited: { icon: IconPencil, label: "Edited", color: "text-primary bg-primary/10" },
  copied: { icon: IconCopy, label: "Copied", color: "text-chart-2 bg-chart-2/10" },
  viewed: { icon: IconEye, label: "Viewed", color: "text-chart-4 bg-chart-4/10" },
}

const comingSoon = [
  { icon: IconTrendingUp, label: "Most Used Prompts", desc: "Track your most frequently accessed prompts" },
  { icon: IconChartLine, label: "Weekly Activity Chart", desc: "Visual overview of your prompt usage" },
  { icon: IconCalendarClock, label: "Custom Date Range", desc: "Filter activity by specific time periods" },
]

function groupByDate(items) {
  const groups = {}
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now - 86400000).toDateString()

  for (const item of items) {
    const date = new Date(item.created_at)
    let key
    if (date.toDateString() === today) key = "Today"
    else if (date.toDateString() === yesterday) key = "Yesterday"
    else key = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function ActivityItem({ item, onOpen }) {
  const config = actionConfig[item.action] || actionConfig.viewed
  const Icon = config.icon
  const deleted = !item.prompt_title

  return (
    <div className="group flex items-start gap-3.5 rounded-xl px-3 py-3 transition-all hover:bg-accent/40">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", config.color)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {deleted ? "Deleted prompt" : item.prompt_title}
          </span>
          <Badge variant="secondary" className="text-[10px] font-normal">{config.label}</Badge>
        </div>
        {!deleted && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.prompt_content}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{formatTime(item.created_at)}</span>
        {!deleted && (
          <button
            onClick={() => onOpen(item.prompt_id)}
            className="flex cursor-pointer items-center justify-center rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
          >
            <IconArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function RecentActivity() {
  const navigate = useNavigate()
  const [activity, setActivity] = useState([])
  const [recentEdited, setRecentEdited] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.db.getActivity(50).catch(() => []),
      window.db.getAllPrompts().catch(() => []),
    ]).then(([act, prompts]) => {
      setActivity(Array.isArray(act) ? act : [])
      const sorted = Array.isArray(prompts) ? [...prompts].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) : []
      setRecentEdited(sorted.slice(0, 10))
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const displayItems = useMemo(() => {
    if (activeTab === "edited") return recentEdited
    if (activeTab === "activity") return activity
    return null
  }, [activeTab, activity, recentEdited])

  const grouped = useMemo(() => {
    if (!displayItems) return null
    if (activeTab === "edited") {
      return {
        "Recently Updated": displayItems,
      }
    }
    return groupByDate(displayItems)
  }, [displayItems, activeTab])

  const tabs = [
    { id: "all", label: "All Activity", icon: IconHistory },
    { id: "edited", label: "Recently Edited", icon: IconPencil },
    { id: "activity", label: "Timeline", icon: IconClock },
  ]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <Clock className="size-5" />
          Recent Activity
        </h1>
      </header>

      <div className="flex items-center gap-1 border-b border-border px-6 py-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className={cn("space-y-4", activeTab === "all" ? "lg:col-span-2" : "lg:col-span-3")}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <IconRefresh className="size-8 animate-spin" />
                  <span className="text-sm">Loading activity...</span>
                </div>
              </div>
            ) : !grouped ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <IconAlertCircle className="size-10" strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-sm font-medium">Select a tab to view activity</p>
                  </div>
                </div>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <IconAlertCircle className="size-10" strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-sm font-medium">No activity yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Start editing and copying prompts to see activity here</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <div className="mb-2 flex items-center gap-2 px-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{dateLabel}</span>
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-[11px] text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {items.map((item) => (
                        <ActivityItem
                          key={item.id || item.prompt_id}
                          item={item}
                          onOpen={(id) => navigate(`/prompts/${id}/edit`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTab === "all" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <IconChartLine className="size-3.5" />
                  Activity Overview
                </h3>
                <div className="space-y-2">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <IconCopy className="size-4" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{activity.filter((a) => a.action === "copied").length}</p>
                        <p className="text-xs text-muted-foreground">Times copied</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconPencil className="size-4" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{activity.filter((a) => a.action === "edited").length}</p>
                        <p className="text-xs text-muted-foreground">Edits made</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                        <IconEye className="size-4" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{activity.filter((a) => a.action === "viewed").length}</p>
                        <p className="text-xs text-muted-foreground">Times viewed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <IconCalendarClock className="size-3.5" />
                  Coming Soon
                </h3>
                <div className="space-y-2">
                  {comingSoon.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <div key={item.label} className="rounded-xl border border-dashed border-border bg-card/30 p-3 opacity-60">
                        <div className="flex items-start gap-3">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <ItemIcon className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
