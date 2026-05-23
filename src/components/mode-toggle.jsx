import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

export function ModeToggle({ expanded }) {
  const { theme, setTheme } = useTheme()

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
          <Sun className="size-5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
