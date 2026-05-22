// File: src/App.jsx
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardCard } from "@/components/dashboard-card"
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
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"

const cards = [
  { icon: Plus, title: "New Prompt", bg: "bg-chart-1 text-white border-chart-1", iconBg: "bg-white/20", description: "Create a new prompt" },
  { icon: Library, title: "Prompt Library", bg: "bg-chart-2 text-white border-chart-2", iconBg: "bg-white/20", description: "Browse all prompts" },
  { icon: Heart, title: "Favorites", bg: "bg-chart-3 text-foreground border-chart-3", iconBg: "bg-background/30", description: "Your saved prompts" },
  { icon: FolderOpen, title: "Collections", bg: "bg-chart-4 text-white border-chart-4", iconBg: "bg-white/20", description: "Organized groups" },
  { icon: Search, title: "Search Prompts", bg: "bg-chart-5 text-white border-chart-5", iconBg: "bg-white/20", description: "Find anything" },
  { icon: Clock, title: "Recent Activity", bg: "bg-primary text-primary-foreground border-primary", iconBg: "bg-white/20", description: "Latest changes" },
  { icon: Download, title: "Export Prompts", bg: "bg-card border-border text-card-foreground", iconBg: "bg-accent", description: "Download as file" },
  { icon: FileText, title: "Templates", bg: "bg-card border-border text-card-foreground", iconBg: "bg-accent", description: "Starter templates" },
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
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-normal">v1.0.0</Badge>
          </div>
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
