import { useMemo, useCallback } from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

import { cn } from "@/lib/utils"

function DataPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 16, 24, 48],
  className,
}) {
  const pageCount = useMemo(() =>
    Math.max(1, Math.ceil(totalItems / pageSize))
  , [totalItems, pageSize])

  const goToPage = useCallback((page) => {
    onPageChange(Math.max(1, Math.min(page, pageCount)))
  }, [onPageChange, pageCount])

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  if (pageCount <= 1 && !onPageSizeChange) return null

  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {start}&ndash;{end} of {totalItems}
        </p>
        {onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v))
              onPageChange(1)
            }}
          >
            <SelectTrigger className="h-7 w-[66px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom">
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => goToPage(1)}
                disabled={currentPage <= 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); goToPage(currentPage - 1) }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((page) => {
                if (page === 1 || page === pageCount) return true
                if (Math.abs(page - currentPage) <= 1) return true
                return false
              })
              .map((page, idx, arr) => {
                const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                return (
                  <span key={page} className="contents">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => { e.preventDefault(); goToPage(page) }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                )
              })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); goToPage(currentPage + 1) }}
                className={currentPage >= pageCount ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => goToPage(pageCount)}
                disabled={currentPage >= pageCount}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export { DataPagination }
