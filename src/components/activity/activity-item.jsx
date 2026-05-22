import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { IconPencil, IconCopy, IconEye, IconArrowRight } from "@tabler/icons-react"

const actionConfig = {
  edited: { icon: IconPencil, label: "Edited", color: "text-primary bg-primary/10" },
  copied: { icon: IconCopy, label: "Copied", color: "text-chart-2 bg-chart-2/10" },
  viewed: { icon: IconEye, label: "Viewed", color: "text-chart-4 bg-chart-4/10" },
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).length
}

export function ActivityItem({ item, onOpen }) {
  const config = actionConfig[item.action] || actionConfig.viewed
  const Icon = config.icon
  const deleted = !item.prompt_title

  return (
    <div
      onClick={() => { if (!deleted) onOpen(item.prompt_id) }}
      className={cn(
        "group flex cursor-pointer items-start gap-3.5 rounded-xl px-3 py-3 transition-all hover:bg-accent/40",
        deleted && "cursor-default"
      )}
    >
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
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          {!deleted && <span>{wordCount(item.prompt_content)} words</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap" title={new Date(item.created_at).toLocaleString()}>
          {relativeTime(item.created_at)}
        </span>
        {!deleted && (
          <div className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary">
            <IconArrowRight className="size-3.5" />
          </div>
        )}
      </div>
    </div>
  )
}
