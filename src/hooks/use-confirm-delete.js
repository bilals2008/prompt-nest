import { useSetting } from "./use-setting"
import { useConfirm } from "@/components/confirm-dialog"

export function useConfirmDelete() {
  const confirm = useConfirm()
  const confirmDelete = useSetting("confirmDelete", "true")

  return (options) => {
    if (String(confirmDelete) === "false") return Promise.resolve(true)
    return confirm({
      title: options.title || "Are you sure?",
      description: options.description || "This action cannot be undone.",
      confirmText: options.confirmText || "Delete",
      destructive: options.destructive !== false,
    })
  }
}
