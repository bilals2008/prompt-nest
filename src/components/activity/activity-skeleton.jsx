export function ActivitySkeleton({ count = 5 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3.5 rounded-xl px-3 py-3">
          <div className="size-8 shrink-0 animate-pulse rounded-lg bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-center" style={{ height: 140 }}>
          <div className="size-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-muted"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
