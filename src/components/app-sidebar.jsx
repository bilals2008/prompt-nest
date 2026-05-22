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
  { icon: FileText, label: "Templates" },
]

const bottomNavItems = [
  { icon: Settings, label: "Settings" },
]

function SidebarButton({ icon: Icon, label, active, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer",
            active
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <span className="font-medium">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-18 flex-col items-center border-r border-border bg-sidebar">
        <div className="flex h-16 w-full items-center justify-center border-b border-border">
          <Avatar className="size-11 rounded-xl">
            <AvatarImage src={logo} alt="Prompt Nest" className="object-contain rounded-xl" />
          </Avatar>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2 py-4">
          {topNavItems.map((item) => (
            <SidebarButton
              key={item.label}
              {...item}
              active={item.path ? location.pathname === item.path : false}
              onClick={item.path ? () => navigate(item.path) : undefined}
            />
          ))}
        </nav>

        <Separator className="mb-2 w-8" />

        <nav className="flex flex-col items-center gap-2 pb-4">
          {bottomNavItems.map((item) => (
            <SidebarButton key={item.label} {...item} />
          ))}
          <ModeToggle />
        </nav>
      </aside>
    </TooltipProvider>
  )
}
