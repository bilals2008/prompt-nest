import { useState, useEffect } from "react"
import { Joyride, STATUS } from "react-joyride"

const TOUR_KEY = "tour_completed"

const STEPS = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Prompt Nest!",
    content: "Let's take a quick tour to show you around. You can skip anytime.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="tour-dashboard"]',
    title: "Dashboard",
    content:
      "Your command center — see total prompts, recent activity, and quick stats at a glance.",
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="tour-new-prompt"]',
    title: "New Prompt",
    content:
      "Click here to create a new prompt. Write, save, and organize your best prompts.",
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="tour-collections"]',
    title: "Collections",
    content:
      "Group related prompts into collections. Keep everything organized by project or topic.",
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="tour-search"]',
    title: "Search",
    content:
      "Search across all your prompts, collections, and favorites — find anything instantly.",
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="tour-settings"]',
    title: "Settings",
    content:
      "Customize your experience: themes, keyboard shortcuts, database management, and more.",
    spotlightPadding: 4,
  },
]

export default function OnboardingTour() {
  const [run, setRun] = useState(false)

  useEffect(() => {
    window.db.getSetting(TOUR_KEY).then((val) => {
      if (!val) setRun(true)
    })
  }, [])

  const handleCallback = (data) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      window.db.setSetting(TOUR_KEY, "true")
      setRun(false)
    }
  }

  return (
    <Joyride
      steps={STEPS}
      run={run}
      callback={handleCallback}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose
      spotlightClicks
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          arrowColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          spotlightShadow: "0 0 0 4px hsl(var(--primary) / 0.3)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipContent: {
          padding: "12px 16px",
          fontSize: "13px",
          lineHeight: "1.5",
          color: "hsl(var(--muted-foreground))",
        },
        tooltipTitle: {
          fontSize: "15px",
          fontWeight: 600,
          color: "hsl(var(--foreground))",
          padding: "8px 16px 0",
        },
        buttonNext: {
          fontSize: "13px",
          fontWeight: 500,
          padding: "6px 16px",
          borderRadius: "6px",
        },
        buttonSkip: {
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
        },
        buttonBack: {
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
          marginRight: "auto",
        },
        progress: {
          fontSize: "11px",
          color: "hsl(var(--muted-foreground))",
        },
      }}
    />
  )
}
