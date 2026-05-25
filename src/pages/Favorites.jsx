import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { PromptCard } from "@/components/prompt-card"
import { BatchActionsBar } from "@/components/batch-actions-bar"
import { Badge } from "@/components/ui/badge"
import { LoadingState, EmptyState } from "@/components/loading-state"
import {
  IconSearch,
  IconX,
  IconHeartFilled,
  IconSortDescending,
  IconHeart,
} from "@tabler/icons-react"
import { toast } from "sonner"

export default function Favorites() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedIds, setSelectedIds] = useState(new Set())

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.db.getFavorites().catch(() => []),
      window.db.getCollections().catch(() => []),
    ]).then(([promptsData, collectionsData]) => {
      setPrompts(Array.isArray(promptsData) ? promptsData : [])
      setCollections(Array.isArray(collectionsData) ? collectionsData : [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filteredAndSorted = useMemo(() => {
    let result = [...prompts]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q))
      )
    }
    result.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0
      const bPinned = b.pinned ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      if (sortBy === "title") return a.title.localeCompare(b.title)
      return 0
    })
    return result
  }, [prompts, searchQuery, sortBy])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, sortBy])

  const handleToggleFavorite = async (id) => {
    const updated = await window.db.toggleFavorite(id)
    if (updated && !updated.favorite) {
      setPrompts((prev) => prev.filter((p) => p.id !== id))
      toast.success("Removed from favorites")
    } else if (updated) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
  }

  const handleTogglePin = async (id) => {
    const updated = await window.db.togglePin(id)
    if (updated) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.success(updated.pinned ? "Prompt pinned" : "Prompt unpinned")
    }
  }

  const handleDelete = async (id) => {
    await window.db.deletePrompt(id)
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    toast.success("Prompt deleted")
  }

  const handleDuplicate = async (id) => {
    const original = prompts.find((p) => p.id === id)
    if (!original) return
    const { id: _, created_at: _c, updated_at: _u, ...rest } = original
    await window.db.createPrompt({
      ...rest,
      title: `${original.title} (Copy)`,
    })
    loadData()
    toast.success("Prompt duplicated")
  }

  const handleSelect = useCallback((id, isSelected) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (isSelected) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAndSorted.map((p) => p.id)))
  }, [filteredAndSorted])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBatchUnfavorite = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    await window.db.batchSetFavorite(ids, false)
    setPrompts((prev) => prev.filter((p) => !ids.includes(p.id)))
    toast.success(`${ids.length} prompt${ids.length !== 1 ? "s" : ""} removed from favorites`)
    handleClearSelection()
  }

  const handleBatchMove = async (collectionId) => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    await window.db.batchSetCollection(ids, collectionId)
    const updatedPrompts = await window.db.getFavorites().catch(() => [])
    setPrompts(Array.isArray(updatedPrompts) ? updatedPrompts : [])
    toast.success(`${ids.length} prompt${ids.length !== 1 ? "s" : ""} moved`)
    handleClearSelection()
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    await window.db.batchDeletePrompts(ids)
    setPrompts((prev) => prev.filter((p) => !ids.includes(p.id)))
    toast.success(`${ids.length} prompt${ids.length !== 1 ? "s" : ""} deleted`)
    handleClearSelection()
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <IconHeart className="size-5 fill-chart-3 text-chart-3" />
          Favorites
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {filteredAndSorted.length} prompt{filteredAndSorted.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex flex-col overflow-hidden">
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <IconSortDescending className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-border bg-card pl-8 pr-8 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              >
                <option value="updated_at">Recent</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div className="flex overflow-hidden rounded-lg border border-border bg-card">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex cursor-pointer items-center justify-center px-2.5 py-1.5 transition-colors ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex cursor-pointer items-center justify-center px-2.5 py-1.5 transition-colors ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <BatchActionsBar
            selectedCount={selectedIds.size}
            totalCount={filteredAndSorted.length}
            allSelected={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onFavorite={handleBatchUnfavorite}
            onMoveToCollection={handleBatchMove}
            onDelete={handleBatchDelete}
            collections={collections}
          />
        )}

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <LoadingState message="Loading favorites..." />
          ) : filteredAndSorted.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No matches found" : "No favorites yet"}
              description={searchQuery ? "Try a different search term" : "Favorite a prompt to see it here"}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAndSorted.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  viewMode="grid"
                    selected={selectedIds.has(prompt.id)}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredAndSorted.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    viewMode="list"
                    selected={selectedIds.has(prompt.id)}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
