import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingState, EmptyState } from "@/components/loading-state"
import { iconOptions, getCollectionIcon, getCollectionColor } from "@/lib/collection-config"
import { getTagColorDot, colorNames } from "@/lib/tag-colors"
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconDotsVertical,
  IconFolderOpen,
  IconCheckbox,
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function Collections() {
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState({ open: false, collection: null })
  const [formName, setFormName] = useState("")
  const [formIcon, setFormIcon] = useState("folder")
  const [formColor, setFormColor] = useState("blue")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.db.getCollections().catch(() => []),
      window.db.getAllPrompts().catch(() => []),
    ]).then(([cols, prs]) => {
      setCollections(Array.isArray(cols) ? cols : [])
      setPrompts(Array.isArray(prs) ? prs : [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const promptCount = (collectionId) =>
    prompts.filter((p) => p.collection_id === collectionId).length

  const lastUpdated = (collectionId) => {
    const colPrompts = prompts.filter((p) => p.collection_id === collectionId)
    if (colPrompts.length === 0) return null
    return colPrompts.reduce((latest, p) =>
      new Date(p.updated_at) > new Date(latest.updated_at) ? p : latest
    ).updated_at
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const openCreateDialog = () => {
    setFormName("")
    setFormIcon("folder")
    setFormColor("blue")
    setEditDialog({ open: true, collection: null })
  }

  const openEditDialog = (collection) => {
    setFormName(collection.name)
    setFormIcon(collection.icon || "folder")
    setFormColor(collection.color || "blue")
    setEditDialog({ open: true, collection })
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    if (editDialog.collection) {
      await window.db.updateCollection(editDialog.collection.id, {
        name: formName.trim(),
        icon: formIcon,
        color: formColor,
      })
      toast.success("Collection updated")
    } else {
      await window.db.createCollection({
        name: formName.trim(),
        icon: formIcon,
        color: formColor,
      })
      toast.success("Collection created")
    }
    setEditDialog({ open: false, collection: null })
    loadData()
  }

  const handleDelete = async (id) => {
    await window.db.deleteCollection(id)
    loadData()
    toast.success("Collection deleted")
  }

  const handleOpen = (id) => {
    navigate(`/prompts?collection=${id}`)
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
    setSelectedIds(new Set(collections.map((c) => c.id)))
  }, [collections])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    await window.db.batchDeleteCollections(ids)
    setCollections((prev) => prev.filter((c) => !ids.includes(c.id)))
    setSelectedIds(new Set())
    setShowDeleteDialog(false)
    toast.success(`${ids.length} collection${ids.length !== 1 ? "s" : ""} deleted`)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <IconFolderOpen className="size-5" />
          Collections
        </h1>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" disabled={selectedIds.size === 0} onClick={() => setShowDeleteDialog(true)}>
                <IconTrash className="size-4" /> Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
                <IconCheckbox className="size-4" /> Select
              </Button>
              <Button onClick={openCreateDialog}>
                <IconPlus className="size-4" />
                New Collection
              </Button>
            </>
          )}
        </div>
      </header>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} collection{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Prompts in these collections will be ungrouped but not deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBatchDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingState message="Loading collections..." />
        ) : collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            description="Create your first collection to organize prompts"
            action={<Button onClick={openCreateDialog}><IconPlus className="size-4" /> Create Collection</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map((col) => {
              const count = promptCount(col.id)
              const updated = lastUpdated(col.id)
              const selected = selectedIds.has(col.id)
              return (
                <div
                  key={col.id}
                  onClick={() => { if (selectMode) { handleSelect(col.id, !selected) } else { handleOpen(col.id) } }}
                  className={cn(
                    "group flex cursor-pointer flex-col gap-3 rounded-xl border p-5 transition-all hover:ring-1 hover:ring-primary/30",
                    selected ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-11 items-center justify-center rounded-xl", getCollectionColor(col.color, col.icon).bg, getCollectionColor(col.color, col.icon).text)}>
                        {(() => { const Icon = getCollectionIcon(col.icon); return <Icon className="size-6" /> })()}
                      </div>
                    </div>
                    {selectMode ? (
                      selected ? (
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                          {Array.from(selectedIds).indexOf(col.id) + 1}
                        </span>
                      ) : (
                        <span className="flex size-8 items-center justify-center rounded-full border border-border text-[11px] text-muted-foreground" />
                      )
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex cursor-pointer items-center justify-center rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                          >
                            <IconDotsVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(col) }}>
                            <IconPencil className="size-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(col.id) }}
                          >
                            <IconTrash className="size-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">{col.name}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{count} prompt{count !== 1 ? "s" : ""}</span>
                      {updated && (
                        <>
                          <span>·</span>
                          <span>Updated {formatDate(updated)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog.collection ? "Edit Collection" : "New Collection"}</DialogTitle>
            <DialogDescription>
              {editDialog.collection ? "Rename or change the icon." : "Create a new collection to organize your prompts."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
              <Input
                placeholder="Collection name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon</label>
              <div className="flex gap-2">
                {iconOptions.map((opt) => {
                  const active = formIcon === opt.value
                  const color = getCollectionColor(formColor, opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFormIcon(opt.value)}
                      className={cn(
                        "flex size-9 cursor-pointer items-center justify-center rounded-lg border transition-all",
                        active
                          ? [color.bg, color.text, "border-current"]
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      <opt.icon className="size-4" />
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex gap-1.5">
                {colorNames.map((c) => {
                  const active = formColor === c
                  const color = getCollectionColor(c)
                  return (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-full border transition-all",
                        active
                          ? "border-ring ring-2 ring-ring ring-offset-1"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <span className={cn("block size-4 rounded-full", getTagColorDot(c))} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editDialog.collection ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
