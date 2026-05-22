import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

function LoadingState({ message = "Loading...", description, className, size = "default" }) {
  return (
    <div className={cn("flex items-center justify-center py-24", className)}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Spinner className={size === "lg" ? "size-8" : "size-6"} />
        <div className="text-center">
          <p className="text-sm">{message}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex items-center justify-center py-24", className)}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        {Icon && <Icon className="size-10" strokeWidth={1.5} />}
        <div className="text-center">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export { LoadingState, EmptyState }
