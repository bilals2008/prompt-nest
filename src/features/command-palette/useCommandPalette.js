import { createContext, useContext, useCallback, useState } from "react"

const RECENT_KEY = "promptnest:recent-commands"
const MAX_RECENT = 5

export const CommandPaletteContext = createContext(null)

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return ctx
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(ids) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids))
}

export function useCommandPaletteState() {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState(loadRecent)

  const toggle = useCallback(() => setOpen((o) => !o), [])

  const addRecent = useCallback((commandId) => {
    setRecent((prev) => {
      const next = [commandId, ...prev.filter((id) => id !== commandId)].slice(
        0,
        MAX_RECENT
      )
      saveRecent(next)
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
    localStorage.removeItem(RECENT_KEY)
  }, [])

  return { open, setOpen, toggle, recent, addRecent, clearRecent }
}
