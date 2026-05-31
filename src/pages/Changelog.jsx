import { APP_VERSION, APP_NAME } from "@/lib/version"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconHistory, IconListCheck, IconStar, IconCode } from "@tabler/icons-react"
import changelogData from "@/data/changelog.json"

function VersionBadge({ type }) {
  const styles = {
    alpha: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    beta: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    stable: "bg-primary/10 text-primary border-primary/20",
    release: "bg-primary/10 text-primary border-primary/20",
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[type] || styles.alpha}`}>
      {type}
    </span>
  )
}

export default function Changelog() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-primary">
          <IconHistory className="size-4" />
          Changelog
        </h1>
        <Badge variant="secondary" className="gap-1.5 font-normal">
          <IconCode className="size-3" />
          {APP_VERSION}
        </Badge>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          <div className="space-y-4">
            {changelogData.releases.map((release, idx) => {
              const isLatest = idx === 0
              return (
                <div key={release.version} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className={`flex size-7 items-center justify-center rounded-lg ${isLatest ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                      <IconStar className="size-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{release.version}</h3>
                        <VersionBadge type={release.type} />
                      </div>
                      <p className="text-xs text-muted-foreground">{release.date}</p>
                    </div>
                  </div>
                  <div className="ml-10 space-y-0.5">
                    {release.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/30">
                        <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <IconListCheck className="size-2.5" />
                        </div>
                        <span className="text-sm text-muted-foreground">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pb-6 text-center text-xs text-muted-foreground">
            {APP_NAME} &copy; {new Date().getFullYear()}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
