// File: src/components/app-sidebar.jsx
import { useLocation, useNavigate } from "react-router-dom"
import {
  IconLayoutDashboard,
  IconPlus,
  IconLibrary,
  IconHeart,
  IconFolderOpen,
  IconSearch,
  IconClock,
  IconDownload,
  IconFileText,
  IconSettings,
  IconLayoutSidebarLeftExpandFilled,
  IconLayoutSidebarLeftCollapseFilled,
  IconHistory,
  IconRefresh,
} from "@tabler/icons-react"
import logo from "@/assets/logo.png"
import logoWhite from "@/assets/logo-white.png"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

import { useState, useEffect, useRef } from "react"
import { UpdateDialog, useUpdateStatus } from "@/components/update-dialog"

const topNavItems = [
  { icon: IconLayoutDashboard, label: "Dashboard", path: "/", tourId: "tour-dashboard" },
  { icon: IconPlus, label: "New Prompt", path: "/prompts/new", tourId: "tour-new-prompt" },
  { icon: IconLibrary, label: "Prompt Library", path: "/prompts" },
  { icon: IconHeart, label: "Favorites", path: "/favorites" },
  { icon: IconFolderOpen, label: "Collections", path: "/collections", tourId: "tour-collections" },
  { icon: IconSearch, label: "Search", path: "/search", tourId: "tour-search" },
  { icon: IconClock, label: "Activity", path: "/activity" },
  { icon: IconDownload, label: "Export", path: "/export" },
  { icon: IconFileText, label: "Templates", path: "/templates" },
]

const bottomNavItems = [
  { icon: IconHistory, label: "Changelog", path: "/changelog" },
  { icon: IconSettings, label: "Settings", path: "/settings", tourId: "tour-settings" },
]

function SidebarButton({ icon: Icon, label, active, onClick, expanded, tourId }) {
  const button = (
    <button
      onClick={onClick}
      data-tour={tourId}
      className={cn(
        "flex items-center gap-3 rounded-lg transition-all duration-200 cursor-pointer",
        expanded
          ? "w-full px-3 h-10"
          : "h-11 w-11 justify-center",
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="size-5 shrink-0" />
      {expanded && <span className="text-sm font-medium truncate">{label}</span>}
    </button>
  )

  if (expanded) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <span className="font-medium">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export function AppSidebar({ expanded, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [updateOpen, setUpdateOpen] = useState(false)
  const { updateAvailable, latestVersion } = useUpdateStatus()
  const notifiedVersion = useRef(null)
  const { theme } = useTheme()
  const logoSrc = theme === "light" ? logoWhite : logo

  useEffect(() => {
    const handler = () => setUpdateOpen(true)
    window.addEventListener('open-update-dialog', handler)
    return () => window.removeEventListener('open-update-dialog', handler)
  }, [])

  useEffect(() => {
    if (updateAvailable && latestVersion && notifiedVersion.current !== latestVersion) {
      notifiedVersion.current = latestVersion
      setTimeout(() => setUpdateOpen(true), 500)
    }
  }, [updateAvailable, latestVersion])

  return (
    <>
      <TooltipProvider delayDuration={300}>
      <aside className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-18 items-center"
      )}>
        <div className={cn(
          "flex h-16 w-full items-center border-b border-border gap-3",
          expanded ? "px-4 justify-start" : "justify-center"
        )}>
          <img src={logoSrc} alt="Prompt Nest" className={cn("shrink-0", expanded ? "size-11 object-contain" : "size-9 object-contain")} />
          {expanded && (
            <span className="text-sm font-semibold text-foreground truncate">Prompt Nest</span>
          )}
        </div>

        <nav className={cn(
          "flex flex-1 flex-col gap-1 py-4",
          expanded ? "px-2" : "items-center"
        )}>
          {topNavItems.map((item) => (
            <SidebarButton
              key={item.label}
              {...item}
              expanded={expanded}
              active={item.path ? location.pathname === item.path : false}
              onClick={item.path ? () => navigate(item.path) : undefined}
              tourId={item.tourId}
            />
          ))}
        </nav>

        <Separator className={cn("mb-2", expanded ? "mx-4" : "w-8")} />

        <nav className={cn(
          "flex flex-col gap-1 pb-4",
          expanded ? "px-2" : "items-center"
        )}>
          {bottomNavItems.map((item) => (
            <SidebarButton
              key={item.label}
              {...item}
              expanded={expanded}
              active={item.path ? location.pathname === item.path : false}
              onClick={item.path ? () => navigate(item.path) : undefined}
              tourId={item.tourId}
            />
          ))}
          <div className={cn("relative", !expanded && "flex justify-center")}>
            <SidebarButton
              icon={IconRefresh}
              label="Check for Updates"
              expanded={expanded}
              onClick={() => setUpdateOpen(true)}
            />
            {updateAvailable && (
              <span className={cn(
                "absolute flex size-2.5",
                expanded ? "top-1 right-2" : "-right-0.5 -top-0.5"
              )}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <SidebarButton
            icon={expanded ? IconLayoutSidebarLeftCollapseFilled : IconLayoutSidebarLeftExpandFilled}
            label={expanded ? "Collapse" : "Expand"}
            expanded={expanded}
            onClick={onToggle}
          />
        </nav>
      </aside>
      </TooltipProvider>
      <UpdateDialog open={updateOpen} onOpenChange={setUpdateOpen} />
    </>
  )
}
