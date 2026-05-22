import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
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
    </div>
  )
}

export default App
