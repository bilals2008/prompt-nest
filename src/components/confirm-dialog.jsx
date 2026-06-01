import { createContext, useContext, useState, useRef, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ConfirmContext = createContext(null)

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Delete",
    cancelText: "Cancel",
    destructive: true,
  })
  const resolverRef = useRef(null)

  const showConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({
        open: true,
        title: options.title || "Are you sure?",
        description: options.description || "This action cannot be undone.",
        confirmText: options.confirmText || "Delete",
        cancelText: options.cancelText || "Cancel",
        destructive: options.destructive !== false,
      })
    })
  }, [])

  const close = (result) => {
    setState((prev) => ({ ...prev, open: false }))
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      <AlertDialog open={state.open} onOpenChange={(open) => { if (!open) close(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            {state.description && (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{state.cancelText}</AlertDialogCancel>
            <AlertDialogAction
              variant={state.destructive ? "destructive" : "default"}
              onClick={() => close(true)}
            >
              {state.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
