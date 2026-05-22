import { cn } from "@/lib/utils"
import { IconPencil, IconCopy, IconEye } from "@tabler/icons-react"

const filterOptions = [
  { id: "all", label: "All" },
  { id: "edited", label: "Edited", icon: IconPencil },
  { id: "copied", label: "Copied", icon: IconCopy },
  { id: "viewed", label: "Viewed", icon: IconEye },
]

export function ActivityFilters({ active, onChange, counts }) {
  return (
    <div className="flex items-center gap-1.5">
      {filterOptions.map((opt) => {
        const Icon = opt.icon
        const count = counts?.[opt.id]
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              active === opt.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3" />}
            <span>{opt.label}</span>
            {count !== undefined && (
              <span className="ml-0.5 text-[10px] opacity-60">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
