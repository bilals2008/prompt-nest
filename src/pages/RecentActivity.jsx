import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/loading-state"
import { DataPagination } from "@/components/data-pagination"
import { ActivityItem } from "@/components/activity/activity-item"
import { ActivityFilters } from "@/components/activity/activity-filters"
import { ActivitySkeleton, ChartSkeleton } from "@/components/activity/activity-skeleton"
import { cn } from "@/lib/utils"
import {
  IconPencil,
  IconClock,
  IconCalendarClock,
  IconChartLine,
  IconTrendingUp,
  IconHistory,
} from "@tabler/icons-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts"

const comingSoon = [
  { icon: IconTrendingUp, label: "Most Used Prompts", desc: "Track your most frequently accessed prompts" },
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

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-sm">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function RecentActivity() {
  const navigate = useNavigate()
  const [activity, setActivity] = useState([])
  const [recentEdited, setRecentEdited] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

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
    if (activeTab === "all") {
      const merged = [
        ...activity.map((a) => ({ ...a, _sort: new Date(a.created_at).getTime() })),
        ...recentEdited.map((p) => ({
          prompt_id: p.id,
          prompt_title: p.title,
          prompt_content: p.content,
          action: "edited",
          created_at: p.updated_at,
          _sort: new Date(p.updated_at).getTime(),
        })),
      ]
      merged.sort((a, b) => b._sort - a._sort)
      return merged
    }
    if (activeTab === "edited") return recentEdited
    if (activeTab === "activity") return activity
    return []
  }, [activeTab, activity, recentEdited])

  const filteredItems = useMemo(() => {
    if (actionFilter === "all") return displayItems
    return displayItems.filter((item) => item.action === actionFilter)
  }, [displayItems, actionFilter])

  const actionCounts = useMemo(() => ({
    all: displayItems.length,
    edited: displayItems.filter((i) => i.action === "edited").length,
    copied: displayItems.filter((i) => i.action === "copied").length,
    viewed: displayItems.filter((i) => i.action === "viewed").length,
  }), [displayItems])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [actionFilter, activeTab])

  const grouped = useMemo(() => {
    if (!paginatedItems.length) return null
    if (activeTab === "edited") {
      return { "Recently Updated": paginatedItems }
    }
    return groupByDate(paginatedItems)
  }, [paginatedItems, activeTab])

  const tabs = [
    { id: "all", label: "All Activity", icon: IconHistory },
    { id: "edited", label: "Recently Edited", icon: IconPencil },
    { id: "activity", label: "Timeline", icon: IconClock },
  ]

  const chartColors = useMemo(() => ({
    primary: cssVar("--primary"),
    chart2: cssVar("--chart-2"),
    chart4: cssVar("--chart-4"),
    muted: cssVar("--muted-foreground"),
    border: cssVar("--border"),
  }), [])

  const dailyData = useMemo(() => {
    const dayMap = {}
    activity.forEach((a) => {
      const day = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (!dayMap[day]) dayMap[day] = { day, edited: 0, copied: 0, viewed: 0 }
      dayMap[day][a.action] = (dayMap[day][a.action] || 0) + 1
    })
    return Object.values(dayMap)
  }, [activity])

  const donutData = useMemo(() => [
    { name: "Edited", value: activity.filter((a) => a.action === "edited").length, color: chartColors.primary },
    { name: "Copied", value: activity.filter((a) => a.action === "copied").length, color: chartColors.chart2 },
    { name: "Viewed", value: activity.filter((a) => a.action === "viewed").length, color: chartColors.chart4 },
  ], [activity, chartColors])

  const weeklyData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" })
      const dayStart = d.toISOString().split("T")[0]
      const count = activity.filter((a) => a.created_at?.startsWith(dayStart)).length
      days.push({ day: dayStr, actions: count })
    }
    return days
  }, [activity])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <IconClock className="size-5" />
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
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className={cn("space-y-4", activeTab === "all" ? "lg:col-span-2" : "lg:col-span-3")}>
            {activeTab !== "edited" && !loading && displayItems.length > 0 && (
              <ActivityFilters
                active={actionFilter}
                onChange={(f) => setActionFilter(f)}
                counts={actionCounts}
              />
            )}

            {loading ? (
              <ActivitySkeleton count={6} />
            ) : !grouped ? (
              <EmptyState title="No activity yet" description="Start editing and copying prompts to see activity here" />
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
                          key={item.id || item.prompt_id + item.created_at}
                          item={item}
                          onOpen={(id) => navigate(`/prompts/${id}/edit`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <DataPagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredItems.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 15, 25, 50]}
                />
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

                {loading ? (
                  <ChartSkeleton />
                ) : activity.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">No activity data yet</p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Action Distribution</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={32}
                            outerRadius={56}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {donutData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 flex justify-center gap-4">
                        {donutData.map((d) => (
                          <div key={d.name} className="flex items-center gap-1.5 text-xs">
                            <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-muted-foreground">{d.name}</span>
                            <span className="font-medium text-foreground">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Daily Activity</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={dailyData} barCategoryGap={6}>
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: chartColors.muted, fontSize: 10 }}
                          />
                          <YAxis hide />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="edited" stackId="a" fill={chartColors.primary} radius={[2, 2, 0, 0]} />
                          <Bar dataKey="copied" stackId="a" fill={chartColors.chart2} radius={[2, 2, 0, 0]} />
                          <Bar dataKey="viewed" stackId="a" fill={chartColors.chart4} radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Weekly Trend</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid stroke={chartColors.border} strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: chartColors.muted, fontSize: 10 }}
                          />
                          <YAxis hide />
                          <Tooltip content={<ChartTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="actions"
                            stroke={chartColors.primary}
                            strokeWidth={2}
                            dot={{ fill: chartColors.primary, r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        {weeklyData.reduce((s, d) => s + d.actions, 0)} total actions this week
                      </p>
                    </div>
                  </div>
                )}
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
