import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Plus,
  Library,
  Heart,
  FolderOpen,
  Search,
  Clock,
  Download,
  FileText,
  Settings,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react"
import logo from "@/assets/logo.png"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

const topNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Plus, label: "New Prompt", path: "/prompts/new" },
  { icon: Library, label: "Prompt Library", path: "/prompts" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: FolderOpen, label: "Collections", path: "/collections" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Clock, label: "Activity", path: "/activity" },
  { icon: Download, label: "Export", path: "/export" },
  { icon: FileText, label: "Templates", path: "/templates" },
]

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
]

function SidebarButton({ icon: Icon, label, active, onClick, expanded }) {
  const button = (
    <button
      onClick={onClick}
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

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-18 items-center"
      )}>
        <div className={cn(
          "flex h-16 w-full items-center border-b border-border gap-3",
          expanded ? "px-4 justify-start" : "justify-center"
        )}>
          <Avatar className="size-11 rounded-xl shrink-0">
            <AvatarImage src={logo} alt="Prompt Nest" className="object-contain rounded-xl" />
          </Avatar>
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
            />
          ))}
          <SidebarButton
            icon={expanded ? PanelLeftClose : PanelLeft}
            label={expanded ? "Collapse" : "Expand"}
            expanded={expanded}
            onClick={onToggle}
          />
          <ModeToggle />
        </nav>
      </aside>
    </TooltipProvider>
  )
}
