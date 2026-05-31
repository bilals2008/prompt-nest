import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export function KeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault()
          navigate("/prompts/new")
          break
        case "e":
          e.preventDefault()
          navigate("/export")
          break
        case "d":
          e.preventDefault()
          if (location.pathname.includes("/prompts/") && location.pathname.includes("/edit")) {
            window.dispatchEvent(new CustomEvent("shortcut:toggle-favorite"))
          }
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate, location])

  return null
}
