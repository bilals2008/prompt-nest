import { cn } from "@/lib/utils"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"

const accentStyles = {
  primary: "bg-primary/12 text-primary",
  blue: "bg-chart-1/12 text-chart-1",
  green: "bg-chart-2/12 text-chart-2",
  yellow: "bg-chart-3/12 text-chart-3",
  purple: "bg-chart-4/12 text-chart-4",
  orange: "bg-chart-5/12 text-chart-5",
  muted: "bg-muted text-muted-foreground",
}

export function DashboardCard({ icon: Icon, title, description, accent = "primary", trend, onClick }) {
  const isUp = trend?.startsWith("+")
  const TrendIcon = isUp ? IconTrendingUp : IconTrendingDown
  const tone = accentStyles[accent] || accentStyles.primary

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-border bg-card p-5 text-center transition-all duration-300 select-none hover:shadow-md hover:bg-accent/50 active:scale-95"
      )}
    >
      <div className={cn(
        "flex size-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
        tone
      )}>
        <Icon className="size-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {trend ? (
          <p className={cn("flex items-center justify-center gap-1 text-xs", isUp ? "text-chart-2" : "text-destructive")}>
            <TrendIcon className="size-3.5" />
            {trend}
          </p>
        ) : null}
      </div>
    </button>
  )
}
