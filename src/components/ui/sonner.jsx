import { useTheme } from "@/hooks/use-theme"
import { Toaster as Sonner } from "sonner";
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconCircleX, IconLoader2 } from "@tabler/icons-react"

const TOASTER_THEMES = { light: "light", dark: "dark", forest: "dark", ocean: "dark", midnight: "dark", rose: "dark", mocha: "dark" }

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()
  const sonnerTheme = theme === "system" ? "system" : (TOASTER_THEMES[theme] || "dark")

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4" />
        ),
        info: (
          <IconInfoCircle className="size-4" />
        ),
        warning: (
          <IconAlertTriangle className="size-4" />
        ),
        error: (
          <IconCircleX className="size-4" />
        ),
        loading: (
          <IconLoader2 className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)"
        }
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props} />
  );
}

export { Toaster }
