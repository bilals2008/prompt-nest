import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { getCollectionIcon } from "@/lib/collection-config"
import {
  IconHeart,
  IconFolder,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

export function BatchActionsBar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onFavorite,
  onMoveToCollection,
  onDelete,
  collections = [],
}) {
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState("")

  if (selectedCount === 0) return null

  const handleMoveConfirm = () => {
    if (selectedCollectionId) {
      onMoveToCollection(selectedCollectionId)
      setShowMoveDialog(false)
      setSelectedCollectionId("")
    }
  }

  const handleDeleteConfirm = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  const handleFavorite = () => {
    onFavorite()
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card/95 px-6 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tabular-nums">
            {selectedCount} selected
          </span>
          <span className="text-xs text-muted-foreground">
            ({allSelected ? "all" : selectedCount + " of " + totalCount})
          </span>
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFavorite}>
            <IconHeart className="size-3.5" />
            Favorite
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowMoveDialog(true)}>
            <IconFolder className="size-3.5" />
            Move
          </Button>

          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <IconTrash className="size-3.5" />
            Delete
          </Button>

          <button
            onClick={onClearSelection}
            className="ml-1 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconX className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {selectedCount} prompt{selectedCount !== 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {collections.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No collections available</p>
            ) : (
              collections.map((col) => {
                const ColIcon = getCollectionIcon(col.icon)
                return (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedCollectionId === col.id
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <ColIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{col.name}</span>
                  </button>
                )
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancel</Button>
            <Button onClick={handleMoveConfirm} disabled={!selectedCollectionId}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} prompt{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected prompts will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
