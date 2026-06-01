import { useState, useEffect } from "react"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IconFileText, IconClipboard, IconCommand, IconCornerDownLeft } from "@tabler/icons-react"
import { toast } from "sonner"


export function SpotlightSearch() {
  const [open, setOpen] = useState(false)
  const [prompts, setPrompts] = useState([])
  const [collections, setCollections] = useState([])

  // Listen to global shortcut event from Electron Main process
  useEffect(() => {
    if (!window.electronAPI?.onGlobalSearch) return
    
    const unsubscribe = window.electronAPI.onGlobalSearch(() => {
      setOpen((prev) => !prev)
    })
    
    return unsubscribe
  }, [])

  // Load prompts & collections whenever the Spotlight panel is opened
  useEffect(() => {
    if (!open) return

    Promise.all([
      window.db.getAllPrompts(),
      window.db.getCollections(),
    ])
      .then(([promptsData, collectionsData]) => {
        setPrompts(Array.isArray(promptsData) ? promptsData : [])
        setCollections(Array.isArray(collectionsData) ? collectionsData : [])
      })
      .catch((err) => {
        console.error("Failed to load spotlight search data:", err)
      })
  }, [open])

  const handleSelectPrompt = async (prompt) => {
    try {
      // 1. Copy content to clipboard
      await navigator.clipboard.writeText(prompt.content)
      
      // 2. Log copy activity in the db
      await window.db.logActivity(prompt.id, "copy")
      
      // 3. Show success feedback
      toast.success(`Copied "${prompt.title}" to clipboard!`)
      
      // 4. Close the Spotlight Dialog
      setOpen(false)
      
      // 5. Minimize the application window
      if (window.electronAPI?.hideWindow) {
        await window.electronAPI.hideWindow()
      }
    } catch (error) {
      console.error("Failed to copy prompt:", error)
      toast.error("Failed to copy prompt")
    }
  }

  // Helper to find collection name by id
  const getCollectionName = (collectionId) => {
    if (!collectionId) return null
    const col = collections.find((c) => c.id === collectionId)
    return col ? col.name : null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[15%] translate-y-0 max-w-3xl overflow-hidden rounded-xl! p-0 gap-0 border border-border bg-popover shadow-lg"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Spotlight Search</DialogTitle>
        <DialogDescription className="sr-only">
          Quickly search prompts, copy to clipboard, and minimize the window.
        </DialogDescription>
        <Command className="rounded-xl! border-0 bg-transparent p-2">
          <CommandInput
            placeholder="Search prompts by title, content, or tags..."
            className="h-12 text-sm focus-visible:ring-0"
          />
          <CommandList className="mt-2 max-h-[500px] overflow-y-auto no-scrollbar">
            <CommandEmpty className="py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No matching prompts found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try refining your search terms.</p>
            </CommandEmpty>

            <CommandGroup heading="All Prompts" className="text-xs text-muted-foreground py-1">
              {prompts.map((prompt) => {
                const tagsList = prompt.tags
                  ? prompt.tags.split(",").map((t) => t.trim().split(":")[0]).filter(Boolean)
                  : []
                const collectionName = getCollectionName(prompt.collection_id)

                return (
                  <CommandItem
                    key={prompt.id}
                    value={`${prompt.title} ${prompt.content} ${prompt.tags}`}
                    onSelect={() => handleSelectPrompt(prompt)}
                    className="flex items-center gap-3 py-3 px-3 my-0.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconFileText className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-foreground">
                          {prompt.title}
                        </span>
                        {collectionName && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal h-4.5 bg-accent text-accent-foreground border-0">
                            {collectionName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                        {prompt.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tagsList.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[9px] py-0 px-1 font-normal h-4 border-border text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
                      
                      <div className="hidden group-data-selected/command-item:flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium px-2 py-0.5 rounded bg-accent border border-border transition-all">
                        <IconClipboard className="size-3" />
                        <span>Copy</span>
                        <IconCornerDownLeft className="size-2.5 ml-0.5 opacity-60" />
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground/60 select-none">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-semibold">
                <IconCommand className="size-2.5" />
                <span>Alt</span>
              </span>
              <span>+</span>
              <span className="flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-semibold">
                <span>P</span>
              </span>
              <span>to toggle</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1 text-[9px] font-semibold">Esc</kbd> to close
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1 text-[9px] font-semibold">Enter</kbd> to copy & minimize
              </span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
