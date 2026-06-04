import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { useSetting, setSetting } from "@/hooks/use-setting"
import {
  IconSun,
  IconMoon,
  IconTrees,
  IconDroplet,
  IconMoonStars,
  IconFlower,
  IconCoffee,
  IconFlame,
  IconCheck,
} from "@tabler/icons-react"

const STORAGE_KEY = "pn-first-run-completed"

const themes = [
  { value: "light", icon: IconSun, label: "Light", group: "light" },
  { value: "amber", icon: IconFlame, label: "Amber", group: "light" },
  { value: "sage", icon: IconTrees, label: "Sage", group: "light" },
  { value: "dark", icon: IconMoon, label: "Dark", group: "dark" },
  { value: "forest", icon: IconTrees, label: "Forest", group: "dark" },
  { value: "ocean", icon: IconDroplet, label: "Ocean", group: "dark" },
  { value: "midnight", icon: IconMoonStars, label: "Midnight", group: "dark" },
  { value: "rose", icon: IconFlower, label: "Rose", group: "dark" },
  { value: "mocha", icon: IconCoffee, label: "Mocha", group: "dark" },
  { value: "cyberpunk", icon: IconMoonStars, label: "Cyberpunk", group: "dark" },
]

const fontSizes = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
]

const defaultViews = [
  { value: "dashboard", label: "Dashboard" },
  { value: "prompts", label: "Prompt Library" },
]

export function FirstRunSetup() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const { theme, setTheme } = useTheme()
  const fontSize = useSetting("fontSize", "medium")
  const defaultView = useSetting("defaultView", "dashboard")

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setOpen(false)
    setStep(0)
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleComplete()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg">Welcome to Prompt Nest</DialogTitle>
          <DialogDescription>
            Let&apos;s set up your workspace in a few steps
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Choose your theme</p>
              <div className="grid grid-cols-5 gap-2">
                {themes.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all cursor-pointer ${
                      theme === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                    {theme === value && (
                      <IconCheck className="size-3 absolute top-1 right-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Text size</p>
              <div className="flex gap-2">
                {fontSizes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSetting("fontSize", value)}
                    className={`flex-1 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                      fontSize === value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Default startup view</p>
              <div className="flex gap-2">
                {defaultViews.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSetting("defaultView", value)}
                    className={`flex-1 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                      defaultView === value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {step === 2 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
