import { useState, useEffect, useMemo } from "react"
import { Library } from "lucide-react"
import { PromptsToolbar } from "@/components/prompts-toolbar"
import { PromptCard } from "@/components/prompt-card"
import {
  IconFiles,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react"

export default function AllPrompts() {
  const [prompts, setPrompts] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedCollection, setSelectedCollection] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.db.getAllPrompts(),
      window.db.getCollections(),
    ]).then(([promptsData, collectionsData]) => {
      setPrompts(promptsData || [])
      setCollections(collectionsData || [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

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

    if (selectedCollection) {
      result = result.filter((p) => p.collection_id === selectedCollection)
    }

    result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title)
      if (sortBy === "favorite") return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
      return new Date(b[sortBy] || b.updated_at) - new Date(a[sortBy] || a.updated_at)
    })

    return result
  }, [prompts, searchQuery, sortBy, selectedCollection])

  const handleToggleFavorite = async (id) => {
    const updated = await window.db.toggleFavorite(id)
    if (updated) {
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
          <Library className="size-5" />
          Prompt Library
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filteredAndSorted.length} prompt{filteredAndSorted.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex flex-col overflow-hidden">
        <div className="border-b border-border px-6 py-3">
          <PromptsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            collections={collections}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
          />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconRefresh className="size-8 animate-spin" />
                <span className="text-sm">Loading prompts...</span>
              </div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconAlertCircle className="size-10" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-sm font-medium">No prompts found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery || selectedCollection ? "Try adjusting your filters" : "Create your first prompt to get started"}
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="flex flex-col gap-2">
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
