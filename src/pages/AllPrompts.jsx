// File: src/pages/AllPrompts.jsx
import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { IconLibrary, IconFiles } from "@tabler/icons-react"
import { PromptsToolbar } from "@/components/prompts-toolbar"
import { PromptCard } from "@/components/prompt-card"
import { BatchActionsBar } from "@/components/batch-actions-bar"
import { LoadingState, EmptyState } from "@/components/loading-state"
import { DataPagination } from "@/components/data-pagination"

export default function AllPrompts() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [prompts, setPrompts] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedCollection, setSelectedCollection] = useState(searchParams.get("collection") || null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(16)
  const [selectedIds, setSelectedIds] = useState(new Set())

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

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSorted.slice(start, start + pageSize)
  }, [filteredAndSorted, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, selectedCollection, pageSize])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, sortBy, selectedCollection])

  const handleEdit = useCallback((id) => {
    navigate(`/prompts/${id}/edit`)
  }, [navigate])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.db.getAllPrompts().catch(() => []),
      window.db.getCollections().catch(() => []),
    ]).then(([promptsData, collectionsData]) => {
      setPrompts(Array.isArray(promptsData) ? promptsData : [])
      setCollections(Array.isArray(collectionsData) ? collectionsData : [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedCollection(searchParams.get("collection") || null)
  }, [searchParams])

  const handleToggleFavorite = async (id) => {
    const updated = await window.db.toggleFavorite(id)
    if (updated) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.success(updated.favorite ? "Added to favorites" : "Removed from favorites")
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
    const allIds = paginatedResults.map((p) => p.id)
    setSelectedIds(new Set(allIds))
  }, [paginatedResults])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBatchFavorite = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    const anyUnfavorited = ids.some((id) => {
      const p = prompts.find((p) => p.id === id)
      return p && !p.favorite
    })
    await window.db.batchSetFavorite(ids, anyUnfavorited)
    const updatedPrompts = await window.db.getAllPrompts().catch(() => [])
    setPrompts(Array.isArray(updatedPrompts) ? updatedPrompts : [])
    toast.success(`${ids.length} prompt${ids.length !== 1 ? "s" : ""} ${anyUnfavorited ? "favorited" : "unfavorited"}`)
    handleClearSelection()
  }

  const handleBatchMove = async (collectionId) => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    await window.db.batchSetCollection(ids, collectionId)
    const updatedPrompts = await window.db.getAllPrompts().catch(() => [])
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
          <IconLibrary className="size-5" />
          Prompt Library
        </h1>
        <span className="text-xs text-muted-foreground">
          {filteredAndSorted.length} prompt{filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
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

        {selectedIds.size > 0 && (
          <BatchActionsBar
            selectedCount={selectedIds.size}
            totalCount={filteredAndSorted.length}
            allSelected={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onFavorite={handleBatchFavorite}
            onMoveToCollection={handleBatchMove}
            onDelete={handleBatchDelete}
            collections={collections}
          />
        )}

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <LoadingState message="Loading prompts..." />
          ) : filteredAndSorted.length === 0 ? (
            <EmptyState
              title="No prompts found"
              description={searchQuery || selectedCollection ? "Try adjusting your filters" : "Create your first prompt to get started"}
            />
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedResults.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      viewMode="grid"
                      selected={selectedIds.has(prompt.id)}
                      onSelect={handleSelect}
                      onEdit={handleEdit}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {paginatedResults.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      viewMode="list"
                      selected={selectedIds.has(prompt.id)}
                      onSelect={handleSelect}
                      onEdit={handleEdit}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              )}

              <DataPagination
                className="mt-6"
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredAndSorted.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}
