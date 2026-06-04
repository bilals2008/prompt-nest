import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  IconPlus,
  IconSearch,
  IconFolderOpen,
  IconKeyboard,
} from "@tabler/icons-react"

const STORAGE_KEY = "pn-onboarding-completed"

const steps = [
  {
    icon: IconPlus,
    title: "Create Your First Prompt",
    description: "Start by creating a prompt. Click the + button in the sidebar or press Ctrl+N.",
  },
  {
    icon: IconFolderOpen,
    title: "Organize with Collections",
    description: "Group related prompts into collections to keep everything tidy.",
  },
  {
    icon: IconSearch,
    title: "Quick Search",
    description: "Press Ctrl+K anywhere to instantly find any prompt.",
  },
  {
    icon: IconKeyboard,
    title: "Keyboard Shortcuts",
    description: "Use Ctrl+N (new), Ctrl+E (edit), Ctrl+D (dashboard) for faster workflow.",
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setOpen(false)
    setCurrentStep(0)
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleCreatePrompt = () => {
    handleComplete()
    navigate("/prompts/new")
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkip()}>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-lg">Welcome to Prompt Nest</DialogTitle>
          <DialogDescription>
            Your personal prompt management workspace
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`size-1.5 rounded-full transition-all cursor-pointer ${
                i === currentStep ? "bg-primary w-4" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            Skip
          </Button>
          {currentStep === 0 ? (
            <Button className="flex-1" onClick={handleCreatePrompt}>
              Create Prompt
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
