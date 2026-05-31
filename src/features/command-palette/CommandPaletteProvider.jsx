import { useHotkeys } from "react-hotkeys-hook"
import {
  CommandPaletteContext,
  useCommandPaletteState,
} from "./useCommandPalette"
import { CommandPalette } from "./CommandPalette"

export function CommandPaletteProvider({ children }) {
  const state = useCommandPaletteState()

  useHotkeys("meta+k,ctrl+k", (e) => {
    e.preventDefault()
    state.toggle()
  })

  return (
    <CommandPaletteContext.Provider value={state}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  )
}
