import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export function DashboardCard({ icon: Icon, title, description, bg, iconBg, trend }) {
  const isUp = trend?.startsWith("+")
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <button
      className={cn(
        "group flex cursor-pointer flex-col items-center gap-4 rounded-xl border p-5 text-center transition-all duration-300 select-none active:scale-95 hover:shadow-md",
        bg || "bg-card border-border text-card-foreground"
      )}
    >
      <div className={cn(
        "flex size-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
        iconBg || "bg-accent"
      )}>
        <Icon className="size-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold leading-tight">{title}</h3>
        <p className="text-sm">{description}</p>
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
