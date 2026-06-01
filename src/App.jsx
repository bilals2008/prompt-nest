// File: src/App.jsx
import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPaletteProvider } from "@/features/command-palette/CommandPaletteProvider"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { SpotlightSearch } from "@/features/spotlight-search/SpotlightSearch.jsx"
import { ConfirmDialogProvider } from "@/components/confirm-dialog"
import { useSetting } from "@/hooks/use-setting"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

function StartupRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const defaultView = useSetting("defaultView", "dashboard")

  useEffect(() => {
    if (location.pathname !== "/") return
    const routes = { dashboard: "/", prompts: "/prompts", last: null }
    const target = routes[defaultView]
    if (target && target !== "/") {
      navigate(target, { replace: true })
    }
  }, [defaultView])

  return null
}

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const compactMode = useSetting("compactMode", "false")
  const fontSize = useSetting("fontSize", "medium")

  useEffect(() => {
    const root = document.documentElement
    if (compactMode === "true") {
      root.classList.add("compact-mode")
    } else {
      root.classList.remove("compact-mode")
    }
  }, [compactMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("font-small", "font-medium", "font-large")
    root.classList.add(`font-${fontSize}`)
  }, [fontSize])

  return (
    <CommandPaletteProvider>
      <ConfirmDialogProvider>
        <StartupRedirect />
        <KeyboardShortcuts />
        <SpotlightSearch />
        <div className="flex h-screen w-full bg-background overflow-hidden">
          <AppSidebar
            expanded={sidebarExpanded}
            onToggle={() => setSidebarExpanded((prev) => !prev)}
          />
          <main className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out",
            sidebarExpanded ? "ml-56" : "ml-18"
          )}>
            <Outlet />
          </main>
          <Toaster />
        </div>
      </ConfirmDialogProvider>
    </CommandPaletteProvider>
  )
}

export default App
