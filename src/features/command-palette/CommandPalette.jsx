import { useNavigate } from "react-router-dom"

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useCommandPalette } from "./useCommandPalette"
import { getCommandsByCategory, getCommandById } from "./commands"

function RecentCommands({ onSelect }) {
  const { recent } = useCommandPalette()

  if (recent.length === 0) return null

  const recentCmds = recent
    .map((id) => getCommandById(id))
    .filter(Boolean)

  if (recentCmds.length === 0) return null

  return (
    <>
      <CommandGroup heading="Recent" className="py-2 border-t border-border">
        {recentCmds.map((cmd) => {
          const Icon = cmd.icon
          return (
            <CommandItem
              key={cmd.id}
              value={cmd.id}
              onSelect={() => onSelect(cmd)}
              className="py-3! px-3! my-0.5"
            >
              <Icon className="size-4.5!" />
              <span>{cmd.name}</span>
            </CommandItem>
          )
        })}
      </CommandGroup>
      <CommandSeparator />
    </>
  )
}

export function CommandPalette() {
  const navigate = useNavigate()
  const { open, setOpen, recent, addRecent } = useCommandPalette()

  const grouped = getCommandsByCategory()

  function handleSelect(command) {
    addRecent(command.id)

    if (command.path) {
      navigate(command.path)
      setOpen(false)
      return
    }

    if (command.action === "create-collection") {
      navigate("/collections")
      setOpen(false)
      return
    }

    if (command.action === "copy-prompt") {
      window.dispatchEvent(new CustomEvent("command-palette:copy-prompt"))
      setOpen(false)
      return
    }

    if (command.action === "favorite-prompt") {
      window.dispatchEvent(new CustomEvent("command-palette:favorite-prompt"))
      setOpen(false)
      return
    }

    if (command.action === "delete-prompt") {
      window.dispatchEvent(new CustomEvent("command-palette:delete-prompt"))
      setOpen(false)
      return
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[15%] translate-y-0 max-w-lg overflow-hidden rounded-xl! p-0 gap-0"
        showCloseButton={false}
      >
        <Command className="rounded-xl! border-0! bg-popover p-2">
          <CommandInput
            placeholder="Search commands..."
            className="h-11!"
          />
          <CommandList className="mt-2 max-h-96!">
            <CommandEmpty className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No results found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try a different search.
              </p>
            </CommandEmpty>

            {recent.length > 0 && <RecentCommands onSelect={handleSelect} />}

            {Object.entries(grouped).map(([category, cmds], i) => (
              <CommandGroup
                key={category}
                heading={category}
                className={cn(
                  "py-2",
                  i > 0 && "mt-1 border-t border-border"
                )}
              >
                {cmds.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={cmd.id}
                      keywords={[cmd.name, cmd.description, ...cmd.keywords]}
                      onSelect={() => handleSelect(cmd)}
                      className="py-3! px-3! my-0.5"
                    >
                      <Icon className="size-4.5!" />
                      <span>{cmd.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
