import { useTheme } from "@/hooks/use-theme"
import { IconSun, IconMoon, IconMonitor, IconTrees, IconDroplet, IconMoonStars, IconFlower, IconCoffee, IconFlame } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themeGroups = [
  {
    label: "Light",
    themes: [
      { value: "light", icon: IconSun, label: "Light" },
      { value: "amber", icon: IconFlame, label: "Amber" },
      { value: "sage", icon: IconTrees, label: "Sage" },
    ],
  },

  {
    label: "Dark",
    themes: [
      { value: "dark", icon: IconMoon, label: "Dark" },
      { value: "forest", icon: IconTrees, label: "Forest" },
      { value: "ocean", icon: IconDroplet, label: "Ocean" },
      { value: "midnight", icon: IconMoonStars, label: "Midnight" },
      { value: "rose", icon: IconFlower, label: "Rose" },
      { value: "mocha", icon: IconCoffee, label: "Mocha" },
    ],
  },
]

export function ModeToggle({ expanded }) {
  const { theme, setTheme } = useTheme()

  const allThemes = themeGroups.flatMap((g) => g.themes)
  const CurrentIcon = allThemes.find((t) => t.value === theme)?.icon || IconSun

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
        {themeGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
              {group.label}
            </DropdownMenuLabel>
            {group.themes.map(({ value, icon: Icon, label }) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="cursor-pointer gap-2">
                <Icon className="size-4" />
                <span>{label}</span>
                {theme === value && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2">
          <IconMonitor className="size-4" />
          <span>System</span>
          {theme === "system" && (
            <span className="ml-auto size-1.5 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
