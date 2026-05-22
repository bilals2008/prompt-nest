import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TagBadge } from "@/components/tag-badge"
import { getTagColorDot, parseTag, colorNames } from "@/lib/tag-colors"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconCopy,
  IconDotsVertical,
  IconTrash,
  IconCopyPlus,
  IconFileExport,
  IconDeviceFloppy,
  IconHeart,
  IconHeartFilled,
  IconEye,
  IconEyeOff,
  IconFileText,
} from "@tabler/icons-react"
import { FileText, Tags, FolderOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function PromptEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const saveTimer = useRef(null)
  const [collections, setCollections] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: "",
    content: "",
    tags: "",
    collection_id: "",
    notes: "",
    favorite: false,
  })

  const [meta, setMeta] = useState({
    created_at: null,
    updated_at: null,
  })

  useEffect(() => {
    window.db.getCollections().then((data) => {
      setCollections(Array.isArray(data) ? data : [])
    })
    if (!isNew) {
      window.db.getPromptById(id).then((data) => {
        if (data) {
          setForm({
            title: data.title || "",
            content: data.content || "",
            tags: data.tags || "",
            collection_id: data.collection_id || "",
            notes: data.notes || "",
            favorite: !!data.favorite,
          })
          setMeta({
            created_at: data.created_at,
            updated_at: data.updated_at,
          })
          window.db.logActivity(id, "viewed").catch(() => {})
        }
      })
    }
  }, [id])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      if (isNew) {
        const created = await window.db.createPrompt({
          title: form.title || "Untitled",
          content: form.content,
          tags: form.tags,
          collection_id: form.collection_id || null,
        })
        if (created) {
          navigate(`/prompts/${created.id}/edit`, { replace: true })
        }
      } else {
        await window.db.updatePrompt(id, {
          title: form.title,
          content: form.content,
          tags: form.tags,
          collection_id: form.collection_id || null,
        })
        const updated = await window.db.getPromptById(id)
        if (updated) {
          setMeta({ created_at: updated.created_at, updated_at: updated.updated_at })
        }
        window.db.logActivity(id, "edited").catch(() => {})
      }
      setDirty(false)
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setSaving(false)
    }
  }, [form, id, isNew, navigate])

  useEffect(() => {
    if (!dirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save()
    }, 2000)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [dirty, save])

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault()
      save()
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(form.content)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = form.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
  }

  const handleDuplicate = async () => {
    if (!form.title && !form.content) return
    const created = await window.db.createPrompt({
      title: form.title ? `${form.title} (Copy)` : "Untitled (Copy)",
      content: form.content,
      tags: form.tags,
      collection_id: form.collection_id || null,
    })
    if (created) {
      navigate(`/prompts/${created.id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (isNew) {
      navigate("/prompts")
      return
    }
    await window.db.deletePrompt(id)
    navigate("/prompts")
  }

  const handleExport = () => {
    const data = {
      title: form.title,
      content: form.content,
      tags: form.tags,
      collection_id: form.collection_id,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${form.title || "prompt"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveAsTemplate = async () => {
    if (!form.title && !form.content) return
    await window.db.createTemplate({
      title: form.title || "Untitled Template",
      content: form.content,
      tags: form.tags,
    })
  }

  const handleToggleFavorite = async () => {
    const newVal = !form.favorite
    updateField("favorite", newVal)
    if (!isNew) {
      await window.db.toggleFavorite(id)
    }
  }

  const wordCount = form.content ? form.content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = form.content ? form.content.length : 0
  const collectionName = collections.find((c) => c.id === form.collection_id)?.name

  const tagList = form.tags
    ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  const updateTagColor = (oldRaw, colorName) => {
    const { name } = parseTag(oldRaw)
    const newTag = name + ":" + colorName
    const oldEntry = oldRaw.includes(":") ? oldRaw : name
    const newTags = tagList.map((t) => (t === oldEntry || t === oldRaw ? newTag : t)).join(", ")
    updateField("tags", newTags)
  }

  const [openColorPicker, setOpenColorPicker] = useState(null)

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconArrowLeft className="size-5" />
          </button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium">{isNew ? "New Prompt" : "Edit Prompt"}</span>
          {dirty && (
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">Unsaved</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconCopy className="size-3.5" />
            Copy
          </button>

          <button
            onClick={handleToggleFavorite}
            className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent"
          >
            {form.favorite ? (
              <IconHeartFilled className="size-4 text-chart-3" />
            ) : (
              <IconHeart className="size-4" />
            )}
          </button>

          <Separator orientation="vertical" className="h-5" />

          <button
            onClick={save}
            disabled={saving}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <IconDeviceFloppy className="size-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <IconDotsVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={handleDuplicate}>
                <IconCopyPlus className="size-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <IconFileExport className="size-3.5" /> Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveAsTemplate}>
                <IconFileText className="size-3.5" /> Save as Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <IconTrash className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <Input
                placeholder="Prompt title..."
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="h-10 rounded-lg border-border bg-transparent px-2.5 text-xl font-bold focus-visible:border-primary/50 focus-visible:ring-1"
              />

              <div className="relative">
                <Textarea
                  placeholder="Write your prompt content here... Supports **markdown** syntax."
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  className="min-h-[300px] resize-y border-border bg-card/30 p-4 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/20"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPreview ? <IconEyeOff className="size-3" /> : <IconEye className="size-3" />}
                    {showPreview ? "Hide preview" : "Preview"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tags className="size-3.5" /> Tags
                  </label>
                  <Input
                    placeholder="react, component, frontend"
                    value={form.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    className="border-border bg-card/30 text-sm"
                  />
                  {tagList.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tagList.map((tag, i) => {
                        const { name, colorName } = parseTag(tag)
                        return (
                          <div key={i} className="relative flex items-center gap-1">
                            <TagBadge tag={tag} />
                            <button
                              onClick={() => setOpenColorPicker(openColorPicker === i ? null : i)}
                              className="flex size-3.5 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-125"
                            >
                              <span className={cn("block size-2 rounded-full", getTagColorDot(colorName || null))} />
                            </button>
                            {openColorPicker === i && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenColorPicker(null)} />
                                <div className="absolute bottom-full left-0 z-50 mb-1.5 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-sm">
                                  {colorNames.map((c) => (
                                    <button
                                      key={c}
                                      onClick={() => { updateTagColor(tag, c); setOpenColorPicker(null) }}
                                      className={cn(
                                        "flex size-5 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-125",
                                        (colorName || "") === c && "ring-2 ring-ring ring-offset-1"
                                      )}
                                    >
                                      <span className={cn("block size-3 rounded-full", getTagColorDot(c))} />
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FolderOpen className="size-3.5" /> Collection
                  </label>
                  <select
                    value={form.collection_id}
                    onChange={(e) => updateField("collection_id", e.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-border bg-card/30 px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">No collection</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="size-3.5" /> Notes
                  </label>
                  <Textarea
                    placeholder="Add internal notes..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="min-h-[80px] resize-y border-border bg-card/30 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden w-60 shrink-0 border-l border-border bg-card/30 p-5 lg:block">
          <div className="space-y-5">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h4>
              <div className="space-y-3">
                {meta.created_at && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Created</p>
                    <p className="text-xs">{new Date(meta.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                )}
                {meta.updated_at && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Updated</p>
                    <p className="text-xs">{new Date(meta.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                )}
                {!meta.created_at && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Status</p>
                    <p className="text-xs">Not saved yet</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h4>
                  {tagList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tagList.map((tag, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <TagBadge tag={tag} />
                          <span className={cn("block size-1.5 rounded-full", getTagColorDot(parseTag(tag).colorName))} />
                        </div>
                      ))}
                    </div>
                  ) : (
                <p className="text-xs text-muted-foreground">No tags</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collection</h4>
              {collectionName ? (
                <div className="flex items-center gap-2 text-xs">
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                  {collectionName}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No collection</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
