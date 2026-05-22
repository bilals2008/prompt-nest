import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { PromptCard } from "@/components/prompt-card"
import { Badge } from "@/components/ui/badge"
import {
  IconSearch,
  IconX,
  IconHeartFilled,
  IconRefresh,
  IconAlertCircle,
  IconSortDescending,
} from "@tabler/icons-react"
import { Heart } from "lucide-react"

export default function Favorites() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [viewMode, setViewMode] = useState("grid")

  const loadData = () => {
    setLoading(true)
    window.db.getFavorites()
      .then((data) => setPrompts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
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
    if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }
    return result
  }, [prompts, searchQuery, sortBy])

  const handleToggleFavorite = async (id) => {
    const updated = await window.db.toggleFavorite(id)
    if (updated && !updated.favorite) {
      setPrompts((prev) => prev.filter((p) => p.id !== id))
    } else if (updated) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
  }

  const handleDelete = async (id) => {
    await window.db.deletePrompt(id)
    setPrompts((prev) => prev.filter((p) => p.id !== id))
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
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <Heart className="size-5 fill-chart-3 text-chart-3" />
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

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconRefresh className="size-8 animate-spin" />
                <span className="text-sm">Loading favorites...</span>
              </div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconAlertCircle className="size-10" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {searchQuery ? "No matches found" : "No favorites yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term"
                      : "Favorite a prompt to see it here"}
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAndSorted.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  viewMode="grid"
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-2">
              {filteredAndSorted.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  viewMode="list"
                  onToggleFavorite={handleToggleFavorite}
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
