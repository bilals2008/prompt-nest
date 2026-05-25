// File: src/components/prompt-card.jsx
import { useState } from "react"
import { cn } from "@/lib/utils"
import { TagBadge } from "@/components/tag-badge"
import { collectionIcons, getCollectionColor } from "@/lib/collection-config"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  IconClipboardCopy,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCopy,
  IconPin,
  IconFolder,
} from "@tabler/icons-react"
import { IconHeart } from "@tabler/icons-react"

export function PromptCard({ prompt, viewMode = "grid", selected = false, onSelect, onToggleFavorite, onTogglePin, onDelete, onDuplicate, onEdit }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = prompt.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    window.db.logActivity(prompt.id, "copied").catch(() => {})
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite?.(prompt.id)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleCheckClick = (e) => {
    e.stopPropagation()
    onSelect?.(prompt.id, !selected)
  }

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-all hover:bg-accent/50 hover:ring-1 hover:ring-primary/20",
          selected ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20" : "border-border bg-card"
        )}
      >
        <div onClick={handleCheckClick} className="flex shrink-0 items-center">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(prompt.id, !!checked)}
            className="cursor-pointer"
          />
        </div>
        <button onClick={handleFavorite} className="shrink-0 cursor-pointer">
          <IconHeart className={cn("size-4 transition-colors", prompt.favorite ? "fill-chart-3 text-chart-3" : "text-muted-foreground hover:text-chart-3")} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {prompt.pinned ? <IconPin className="size-3.5 shrink-0 -rotate-45 text-primary" /> : null}
            <span className="truncate text-sm font-medium">{prompt.title}</span>
            {prompt.collection_id && (() => {
              const colColor = getCollectionColor(prompt.collection_color, prompt.collection_icon)
              return (
                <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-4xl border px-2 py-0.5 text-[10px] font-normal", colColor.bg, colColor.text, colColor.border)}>
                  {(() => { const Icon = collectionIcons[prompt.collection_icon]?.icon || IconFolder; return <Icon className="size-3" /> })()}
                  {prompt.collection_name || "Collection"}
                </span>
              )
            })()}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{prompt.content}</p>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {prompt.tags?.split(",").slice(0, 2).map((tag) => (
            <TagBadge key={tag.trim()} tag={tag.trim()} />
          ))}
        </div>

        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{formatDate(prompt.updated_at)}</span>

        <button
          onClick={handleCopy}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <IconClipboardCopy className="size-3.5" />
          {copied ? "Copied!" : "Copy"}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <IconDotsVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(prompt.id) }}>
              <IconPencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(prompt.id) }}>
              <IconCopy className="size-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin?.(prompt.id) }}>
              <IconPin className={cn("size-3.5", prompt.pinned && "text-primary")} /> {prompt.pinned ? "Pinned" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(prompt.id) }}>
              <IconTrash className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl border transition-all hover:ring-1 hover:ring-primary/30",
        selected ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20" : "border-border bg-card"
      )}
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div onClick={handleCheckClick} className="flex shrink-0 items-center pt-0.5">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect?.(prompt.id, !!checked)}
              className="cursor-pointer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{prompt.title}</h3>
            {prompt.collection_id && (() => {
              const colColor = getCollectionColor(prompt.collection_color, prompt.collection_icon)
              return (
                <span className={cn("mt-1 inline-flex items-center gap-1 rounded-4xl border px-2 py-0.5 text-[10px] font-normal", colColor.bg, colColor.text, colColor.border)}>
                  {(() => { const Icon = collectionIcons[prompt.collection_icon]?.icon || IconFolder; return <Icon className="size-3" /> })()}
                  {prompt.collection_name || "Collection"}
                </span>
              )
            })()}
          </div>
          <button onClick={handleFavorite} className="shrink-0 cursor-pointer">
            <IconHeart className={cn("size-4 transition-colors", prompt.favorite ? "fill-chart-3 text-chart-3" : "text-muted-foreground hover:text-chart-3")} />
          </button>
          {prompt.pinned ? (
            <IconPin className="size-3.5 shrink-0 -rotate-45 text-primary" />
          ) : null}
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">{prompt.content}</p>

        {prompt.tags && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.split(",").map((tag) => (
              <TagBadge key={tag.trim()} tag={tag.trim()} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="text-[11px] text-muted-foreground">{formatDate(prompt.updated_at)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <IconClipboardCopy className="size-3" />
            {copied ? "Copied!" : "Copy"}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <IconDotsVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(prompt.id) }}>
                <IconPencil className="size-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(prompt.id)}>
                <IconCopy className="size-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin?.(prompt.id)}>
                <IconPin className={cn("size-3.5", prompt.pinned && "text-primary")} /> {prompt.pinned ? "Pinned" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(prompt.id)}>
                <IconTrash className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
