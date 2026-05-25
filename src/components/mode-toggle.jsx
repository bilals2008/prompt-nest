import { useTheme } from "@/hooks/use-theme"
import { IconSun, IconMoon, IconMonitor, IconTrees, IconDroplet } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
  { value: "light", icon: IconSun, label: "Light" },
  { value: "dark", icon: IconMoon, label: "Dark" },
  { value: "forest", icon: IconTrees, label: "Forest" },
  { value: "ocean", icon: IconDroplet, label: "Ocean" },
  { value: "system", icon: IconMonitor, label: "System" },
]

export function ModeToggle({ expanded }) {
  const { theme, setTheme } = useTheme()
  const CurrentIcon = themes.find((t) => t.value === theme)?.icon || IconSun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center rounded-lg transition-all duration-200 cursor-pointer gap-2",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            expanded ? "w-full px-3 h-10" : "h-11 w-11 justify-center"
          )}
        >
          <CurrentIcon className="size-5 shrink-0" />
          {expanded && <span className="text-sm font-medium truncate">Theme</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" sideOffset={12}>
        {themes.map(({ value, icon: Icon, label }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="cursor-pointer gap-2">
            <Icon className="size-4" />
            <span>{label}</span>
            {theme === value && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
