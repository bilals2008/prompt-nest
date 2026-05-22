import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

const accentStyles = {
  blue: { iconWrap: "bg-chart-1/12 text-chart-1", badge: "bg-chart-1/12 text-chart-1 border-chart-1/25" },
  green: { iconWrap: "bg-chart-2/12 text-chart-2", badge: "bg-chart-2/12 text-chart-2 border-chart-2/25" },
  yellow: { iconWrap: "bg-chart-3/12 text-chart-3", badge: "bg-chart-3/12 text-chart-3 border-chart-3/25" },
  purple: { iconWrap: "bg-chart-4/12 text-chart-4", badge: "bg-chart-4/12 text-chart-4 border-chart-4/25" },
  orange: { iconWrap: "bg-chart-5/12 text-chart-5", badge: "bg-chart-5/12 text-chart-5 border-chart-5/25" },
  primary: { iconWrap: "bg-primary/12 text-primary", badge: "bg-primary/12 text-primary border-primary/25" },
  muted: { iconWrap: "bg-muted text-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
}

const sizeStyles = {
  sm: {
    wrapper: "px-2 py-2",
    gap: "gap-2",
    label: "text-[9px]",
    value: "text-lg",
    hint: "mt-1 text-[10px]",
    hintIcon: "size-3",
    iconWrap: "size-7",
    icon: "h-3.5 w-3.5",
    badge: "text-[9px] px-1 py-0.5",
  },
  md: {
    wrapper: "px-3 py-2.5",
    gap: "gap-3",
    label: "text-[10px]",
    value: "text-2xl",
    hint: "mt-1.5 text-[11px]",
    hintIcon: "size-3.5",
    iconWrap: "size-10",
    icon: "h-5 w-5",
    badge: "text-[10px] px-1.5 py-0.5",
  },
  lg: {
    wrapper: "px-4 py-3",
    gap: "gap-4",
    label: "text-[11px]",
    value: "text-3xl",
    hint: "mt-2 text-xs",
    hintIcon: "size-4",
    iconWrap: "size-12",
    icon: "h-6 w-6",
    badge: "text-[11px] px-2 py-1",
  },
  xl: {
    wrapper: "px-5 py-4",
    gap: "gap-5",
    label: "text-xs",
    value: "text-4xl",
    hint: "mt-2 text-sm",
    hintIcon: "size-4",
    iconWrap: "size-14",
    icon: "h-7 w-7",
    badge: "text-xs px-2.5 py-1",
  },
}

export function StatCard({
  label,
  value,
  hint,
  hintIcon: HintIcon,
  badge,
  icon: Icon,
  trend,
  desc,
  accent = "blue",
  size = "md",
  className,
}) {
  const tone = accentStyles[accent] || accentStyles.blue
  const dims = sizeStyles[size] || sizeStyles.md

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm",
        dims.wrapper,
        className
      )}
    >
      <div className={cn("flex items-center justify-between", dims.gap)}>
        <div className="min-w-0">
          <p className={cn("font-semibold uppercase tracking-[0.1em] text-muted-foreground", dims.label)}>
            {label}
          </p>
          <p className={cn("mt-1 leading-none font-semibold tracking-tight text-foreground", dims.value)}>
            {value}
          </p>
          {trend ? (
            <p className={cn("flex items-center gap-1", dims.hint, trend.startsWith("+") ? "text-chart-2" : "text-destructive")}>
              {trend.startsWith("+") ? <TrendingUp className={dims.hintIcon} /> : <TrendingDown className={dims.hintIcon} />}
              {trend}
            </p>
          ) : desc ? (
            <p className={cn("text-muted-foreground", dims.hint)}>{desc}</p>
          ) : null}
          {hint ? (
            <p className={cn("flex items-center gap-1 text-muted-foreground", dims.hint)}>
              {HintIcon ? <HintIcon className={cn(dims.hintIcon)} /> : null}
              {hint}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge ? (
            <span className={cn("rounded-full border font-semibold leading-none", tone.badge, dims.badge)}>
              {badge}
            </span>
          ) : null}
          {Icon ? (
            <div className={cn("inline-flex items-center justify-center rounded-md shrink-0", dims.iconWrap, tone.iconWrap)}>
              <Icon className={dims.icon} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
