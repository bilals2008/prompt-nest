import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LoadingState, EmptyState } from "@/components/loading-state"
import {
  IconTags,
  IconSearch,
  IconX,
  IconSortDescending,
  IconPencil,
  IconGitMerge,
  IconTrash,
  IconCheck,
  IconArrowBackUp,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getTagColorDot } from "@/lib/tag-colors"

const PAGE_SIZE = 20

export function TagManagementSheet({ open, onOpenChange, onTagsChanged }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("count")
  const [currentPage, setCurrentPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [merging, setMerging] = useState(null)
  const [mergeValue, setMergeValue] = useState("")

  useEffect(() => { if (open) loadTags() }, [open])

  async function loadTags() {
    setLoading(true)
    try {
      const result = await window.db.tags.getAll()
      setTags(result)
    } catch {
      toast.error("Failed to load tags")
    }
    setLoading(false)
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...tags]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return b.count - a.count
    })
    return result
  }, [tags, searchQuery, sortBy])

  const pageCount = Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredAndSorted.slice(start, start + PAGE_SIZE)
  }, [filteredAndSorted, currentPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, sortBy])

  async function handleRename(oldName) {
    if (!editValue.trim() || editValue.trim() === oldName) { setEditing(null); return }
    try {
      await window.db.tags.rename(oldName, editValue.trim())
      toast.success(`Renamed "${oldName}" → "${editValue.trim()}"`)
      setEditing(null); await loadTags(); onTagsChanged?.()
    } catch { toast.error("Failed to rename tag") }
  }

  async function handleMerge(source) {
    if (!mergeValue.trim() || mergeValue.trim() === source) { setMerging(null); return }
    try {
      await window.db.tags.merge(source, mergeValue.trim())
      toast.success(`Merged "${source}" → "${mergeValue.trim()}"`)
      setMerging(null); await loadTags(); onTagsChanged?.()
    } catch { toast.error("Failed to merge tag") }
  }

  async function handleDelete(tagName) {
    try {
      await window.db.tags.delete(tagName)
      toast.success(`Deleted tag "${tagName}"`)
      await loadTags(); onTagsChanged?.()
    } catch { toast.error("Failed to delete tag") }
  }

  function ActionButton({ icon: Icon, label, onClick, destructive }) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "size-7 cursor-pointer transition-all duration-200 hover:scale-110",
              destructive
                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={onClick}
          >
            <Icon className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          <span className="text-xs">{label}</span>
        </TooltipContent>
      </Tooltip>
    )
  }

  function renderActions(tag) {
    if (editing === tag.name) {
      return (
        <div className="flex gap-1">
          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename(tag.name)} className="h-7 w-24 text-xs" autoFocus />
          <Button size="icon" variant="ghost" className="size-7 cursor-pointer" onClick={() => handleRename(tag.name)}><IconCheck className="size-3.5" /></Button>
          <Button size="icon" variant="ghost" className="size-7 cursor-pointer" onClick={() => setEditing(null)}><IconArrowBackUp className="size-3.5" /></Button>
        </div>
      )
    }
    if (merging === tag.name) {
      return (
        <div className="flex gap-1 items-center">
          <span className="text-[10px] text-muted-foreground">into</span>
          <Input value={mergeValue} onChange={(e) => setMergeValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleMerge(tag.name)} className="h-7 w-24 text-xs" autoFocus />
          <Button size="icon" variant="ghost" className="size-7 cursor-pointer" onClick={() => handleMerge(tag.name)}><IconCheck className="size-3.5" /></Button>
          <Button size="icon" variant="ghost" className="size-7 cursor-pointer" onClick={() => setMerging(null)}><IconArrowBackUp className="size-3.5" /></Button>
        </div>
      )
    }
    return (
      <div className="flex gap-0.5">
        <ActionButton icon={IconPencil} label="Rename" onClick={() => { setEditing(tag.name); setEditValue(tag.name) }} />
        <ActionButton icon={IconGitMerge} label="Merge" onClick={() => { setMerging(tag.name); setMergeValue("") }} />
        <ActionButton icon={IconTrash} label="Delete" destructive onClick={() => handleDelete(tag.name)} />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <IconTags className="size-4 text-primary" />
            Tag Management
          </SheetTitle>
        </SheetHeader>

        <div className="border-b border-border px-5 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-7 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-1.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground"><IconX className="size-3" /></button>
              )}
            </div>
            <div className="relative">
              <IconSortDescending className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-8 appearance-none rounded-md border border-border bg-card pl-7 pr-6 text-[11px] text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20">
                <option value="count">Count</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          {loading ? (
            <LoadingState message="Loading tags..." />
          ) : filteredAndSorted.length === 0 ? (
            <EmptyState title="No tags found" description={searchQuery ? "Try a different search" : "Tags appear when you add them to prompts"} />
          ) : (
            <>
              <div className="space-y-0.5">
                {paginated.map((tag) => (
                  <div key={tag.name} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent/30 transition-colors">
                    <div className={cn("size-2 rounded-full shrink-0", getTagColorDot(tag.name))} />
                    <span className="flex-1 text-sm font-medium min-w-0 truncate">{tag.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums mr-1">{tag.count}</span>
                    {renderActions(tag)}
                  </div>
                ))}
              </div>

              {filteredAndSorted.length > 35 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Page {currentPage} of {pageCount}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 cursor-pointer transition-all duration-200 hover:scale-105"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <IconChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 cursor-pointer transition-all duration-200 hover:scale-105"
                      disabled={currentPage >= pageCount}
                      onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                    >
                      <IconChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
    </TooltipProvider>
  )
}
