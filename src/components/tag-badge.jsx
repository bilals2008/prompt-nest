// File: src/components/tag-badge.jsx
import { cn } from "@/lib/utils"
import { getTagColor, parseTag } from "@/lib/tag-colors"

function TagBadge({ tag, className, ...props }) {
  const { name } = parseTag(tag)
  const color = getTagColor(tag)
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 text-[10px] font-normal whitespace-nowrap transition-all",
        color.bg, color.text, color.border,
        className
      )}
      {...props}
    >
      {name}
    </span>
  )
}

export { TagBadge }
