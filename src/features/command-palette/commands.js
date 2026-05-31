import {
  IconLayoutDashboard,
  IconLibrary,
  IconFolderOpen,
  IconHeart,
  IconSearch,
  IconClock,
  IconFileText,
  IconDownload,
  IconSettings,
  IconHistory,
  IconPlus,
  IconFolderPlus,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react"

const COMMANDS = [
  {
    id: "nav-dashboard",
    name: "Dashboard",
    description: "Go to dashboard",
    keywords: ["home", "main"],
    category: "Navigation",
    icon: IconLayoutDashboard,
    path: "/",
  },
  {
    id: "nav-prompts",
    name: "All Prompts",
    description: "Browse prompt library",
    keywords: ["library", "browse", "all"],
    category: "Navigation",
    icon: IconLibrary,
    path: "/prompts",
  },
  {
    id: "nav-collections",
    name: "Collections",
    description: "Manage collections",
    keywords: ["folders", "groups", "organize"],
    category: "Navigation",
    icon: IconFolderOpen,
    path: "/collections",
  },
  {
    id: "nav-favorites",
    name: "Favorites",
    description: "View favorite prompts",
    keywords: ["liked", "saved", "bookmarked", "starred"],
    category: "Navigation",
    icon: IconHeart,
    path: "/favorites",
  },
  {
    id: "nav-search",
    name: "Search",
    description: "Search prompts and collections",
    keywords: ["find", "lookup", "query"],
    category: "Navigation",
    icon: IconSearch,
    path: "/search",
  },
  {
    id: "nav-activity",
    name: "Recent Activity",
    description: "View recent activity",
    keywords: ["history", "recent", "changes", "log"],
    category: "Navigation",
    icon: IconClock,
    path: "/activity",
  },
  {
    id: "nav-templates",
    name: "Templates",
    description: "Browse prompt templates",
    keywords: ["starter", "boilerplate", "presets"],
    category: "Navigation",
    icon: IconFileText,
    path: "/templates",
  },
  {
    id: "nav-export",
    name: "Export",
    description: "Export or import data",
    keywords: ["backup", "download", "import", "share"],
    category: "Navigation",
    icon: IconDownload,
    path: "/export",
  },
  {
    id: "nav-settings",
    name: "Settings",
    description: "Configure application",
    keywords: ["preferences", "config", "options", "prefs"],
    category: "Navigation",
    icon: IconSettings,
    path: "/settings",
  },
  {
    id: "nav-changelog",
    name: "Changelog",
    description: "View release history",
    keywords: ["updates", "version", "release notes"],
    category: "Navigation",
    icon: IconHistory,
    path: "/changelog",
  },
  {
    id: "action-new-prompt",
    name: "New Prompt",
    description: "Create a new prompt",
    keywords: ["create", "add", "write"],
    category: "Prompts",
    icon: IconPlus,
    path: "/prompts/new",
  },
  {
    id: "action-create-collection",
    name: "Create Collection",
    description: "Create a new collection",
    keywords: ["new folder", "add group", "organize"],
    category: "Collections",
    icon: IconFolderPlus,
    action: "create-collection",
  },
  {
    id: "action-copy-prompt",
    name: "Copy Prompt",
    description: "Copy current prompt to clipboard",
    keywords: ["clipboard", "duplicate text"],
    category: "Prompts",
    icon: IconCopy,
    action: "copy-prompt",
    requiresPrompt: true,
  },
  {
    id: "action-favorite-prompt",
    name: "Favorite Prompt",
    description: "Toggle favorite on current prompt",
    keywords: ["like", "save", "bookmark", "star"],
    category: "Prompts",
    icon: IconHeart,
    action: "favorite-prompt",
    requiresPrompt: true,
  },
  {
    id: "action-delete-prompt",
    name: "Delete Prompt",
    description: "Delete current prompt",
    keywords: ["remove", "trash"],
    category: "Prompts",
    icon: IconTrash,
    action: "delete-prompt",
    requiresPrompt: true,
  },
]

export function getCommands() {
  return COMMANDS
}

export function getCommandsByCategory() {
  const grouped = {}
  for (const cmd of COMMANDS) {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = []
    }
    grouped[cmd.category].push(cmd)
  }
  return grouped
}

export function getCommandById(id) {
  return COMMANDS.find((cmd) => cmd.id === id) || null
}
