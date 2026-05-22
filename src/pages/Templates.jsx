import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import {
  IconFileText,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
  IconCopyPlus,
  IconSearch,
} from "@tabler/icons-react"
import { FileText } from "lucide-react"

export default function Templates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = () => {
    setLoading(true)
    window.db.getTemplates()
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUseTemplate = async (tpl) => {
    const created = await window.db.createPrompt({
      title: tpl.title,
      content: tpl.content,
      tags: tpl.tags,
    })
    if (created) {
      navigate(`/prompts/${created.id}/edit`)
    }
  }

  const handleDelete = async (id) => {
    await window.db.deleteTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = templates.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <FileText className="size-4" />
          Templates
        </h1>
        <div className="relative w-56">
          <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <IconRefresh className="size-8 animate-spin" />
              <span className="text-sm">Loading templates...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <IconAlertCircle className="size-10" strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm font-medium">No templates found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search ? "Try a different search term" : "Save a prompt as a template from the editor"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tpl) => {
              const tags = tpl.tags ? tpl.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
              return (
                <div
                  key={tpl.id}
                  className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:ring-1 hover:ring-primary/30"
                >
                  <button
                    onClick={() => handleUseTemplate(tpl)}
                    className="flex flex-1 flex-col items-start gap-3 p-4 text-left cursor-pointer"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconFileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold line-clamp-1">{tpl.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{tpl.content}</p>
                    </div>
                  </button>
                  <div className="flex items-center justify-between border-t border-border px-4 py-2">
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] font-normal leading-none">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{tags.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      <button
                        onClick={() => handleUseTemplate(tpl)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                        title="Use template"
                      >
                        <IconCopyPlus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
