import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { TagBadge } from "@/components/tag-badge"
import { collectionIcons, getCollectionColor } from "@/lib/collection-config"
import { cn } from "@/lib/utils"
import {
  IconSearch,
  IconX,
  IconCopy,
  IconArrowRight,
  IconHeart,
  IconHeartFilled,
  IconStar,
  IconStarFilled,
  IconClock,
  IconFolder,
} from "@tabler/icons-react"

const filters = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "recent", label: "Recent" },
]

export default function Search() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [collections, setCollections] = useState([])
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [results, setResults] = useState([])

  useEffect(() => {
    window.db.getCollections().then((data) => {
      setCollections(Array.isArray(data) ? data : [])
    })
    inputRef.current?.focus()
  }, [])

  const collectionMap = useMemo(() => {
    const map = {}
    collections.forEach((c) => { map[c.id] = c.name })
    return map
  }, [collections])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await window.db.searchPrompts(query.trim(), activeFilter)
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, activeFilter])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [query, activeFilter])

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      navigate(`/prompts/${results[selectedIndex].id}/edit`)
    } else if (e.key === "Escape") {
      setQuery("")
      inputRef.current?.blur()
    }
  }, [results, selectedIndex, navigate])

  const highlightMatch = (text) => {
    if (!query.trim()) return text
    const terms = query.trim().split(/\s+/).filter(Boolean)
    let result = text
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      result = result.replace(new RegExp(`(${escaped})`, "gi"), "<mark class='bg-primary/20 text-foreground rounded px-0.5'>$1</mark>")
    }
    return result
  }

  const handleCopy = async (e, content) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Copied to clipboard")
    } catch {
      const ta = document.createElement("textarea")
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      toast.success("Copied to clipboard")
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border bg-card/50 px-6 py-5">
        <div className="relative mx-auto w-full max-w-2xl">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search titles, content, tags, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-10 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-6 py-2.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeFilter === f.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        {query && results.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/5">
              <IconSearch className="size-8" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">Search your prompt library</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Type to search across titles, content, tags, and collections
            </p>
            <div className="mt-6 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">↑</kbd>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">↵</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">Esc</kbd>
                Clear
              </span>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <p className="text-sm font-medium">No results found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try different keywords or adjust filters</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mx-auto max-w-4xl flex flex-col gap-1.5">
              {results.map((prompt, index) => (
                <div
                  key={prompt.id}
                  onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-4 rounded-xl px-4 py-3.5 transition-all",
                    index === selectedIndex
                      ? "bg-accent ring-1 ring-primary/20"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    {prompt.favorite ? (
                      <IconStarFilled className="size-4 text-chart-3" />
                    ) : (
                      <IconStar className="size-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className="truncate text-sm font-medium"
                        dangerouslySetInnerHTML={{ __html: highlightMatch(prompt.title) }}
                      />
                      {prompt.collection_id && (() => {
                        const colColor = getCollectionColor(prompt.collection_color, prompt.collection_icon)
                        return (
                          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-4xl border px-2 py-0.5 text-[10px] font-normal", colColor.bg, colColor.text, colColor.border)}>
                            {(() => { const Icon = collectionIcons[prompt.collection_icon]?.icon || IconFolder; return <Icon className="size-3" /> })()}
                            {collectionMap[prompt.collection_id] || "Collection"}
                          </span>
                        )
                      })()}
                    </div>
                    <p
                      className="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(prompt.content) }}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      {prompt.tags?.split(",").map((tag) => {
                        const trimmed = tag.trim()
                        if (!trimmed) return null
                        return <TagBadge key={trimmed} tag={trimmed} />
                      })}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <span className="hidden text-[11px] text-muted-foreground sm:block">
                      {new Date(prompt.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <button
                      onClick={(e) => handleCopy(e, prompt.content)}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                      title="Copy content"
                    >
                      <IconCopy className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/prompts/${prompt.id}/edit`) }}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      title="Open in editor"
                    >
                      <IconArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
