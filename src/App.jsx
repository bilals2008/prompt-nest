import { AppSidebar } from "@/components/app-sidebar"
import { DashboardCard } from "@/components/dashboard-card"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Library,
  Heart,
  FolderOpen,
  Search,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  FileStack,
  Tags,
  GitFork,
  Zap,
} from "lucide-react"

const cards = [
  { icon: Plus, title: "New Prompt", accent: "primary", description: "Create a new prompt" },
  { icon: Library, title: "Prompt Library", accent: "blue", description: "Browse all prompts" },
  { icon: Heart, title: "Favorites", accent: "yellow", description: "Your saved prompts" },
  { icon: FolderOpen, title: "Collections", accent: "purple", description: "Organized groups" },
  { icon: Search, title: "Search Prompts", accent: "green", description: "Find anything" },
  { icon: Clock, title: "Recent Activity", accent: "orange", description: "Latest changes" },
  { icon: Download, title: "Export Prompts", accent: "muted", description: "Download as file" },
  { icon: FileText, title: "Templates", accent: "primary", description: "Starter templates" },
]

function App() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <main className="ml-18 flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
            <LayoutDashboard className="size-5" />
            Dashboard
          </h1>
          <Badge variant="secondary" className="font-normal">v1.0.0</Badge>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto mb-6 grid max-w-6xl grid-cols-4 gap-4">
            <StatCard label="Total Prompts" value="247" icon={FileStack} accent="blue" size="md" trend="+12%" />
            <StatCard label="Categories" value="12" icon={Tags} accent="green" size="md" desc="Organized by use case" />
            <StatCard label="Collections" value="8" icon={GitFork} accent="purple" size="md" desc="Curated prompt sets" />
            <StatCard label="This Week" value="34" icon={Zap} accent="orange" size="md" trend="+18%" />
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <DashboardCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
