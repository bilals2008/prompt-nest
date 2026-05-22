import {
  IconSearch,
  IconFilter,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutList,
  IconX,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function PromptsToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  collections = [],
  selectedCollection,
  onCollectionChange,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <IconFilter className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          value={selectedCollection || ""}
          onChange={(e) => onCollectionChange(e.target.value || null)}
          className="h-9 appearance-none rounded-lg border border-border bg-card pl-8 pr-8 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <IconSortDescending className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-border bg-card pl-8 pr-8 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        >
          <option value="updated_at">Updated</option>
          <option value="created_at">Created</option>
          <option value="title">Title</option>
          <option value="favorite">Favorites</option>
        </select>
      </div>

      <div className="flex overflow-hidden rounded-lg border border-border bg-card">
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "flex cursor-pointer items-center justify-center px-2.5 py-1.5 transition-colors",
            viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <IconLayoutGrid className="size-4" />
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={cn(
            "flex cursor-pointer items-center justify-center px-2.5 py-1.5 transition-colors",
            viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <IconLayoutList className="size-4" />
        </button>
      </div>
    </div>
  )
}
