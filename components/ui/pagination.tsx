"use client";

import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  /** Announced to screen readers; set it when a page has more than one list. */
  label?: string;
}

type PageSlot = number | "gap-start" | "gap-end";

/**
 * First page, last page, and a window around the current one — with the window
 * clamped so it can never overlap or reorder the two fixed ends (which used to
 * emit duplicate or out-of-order page numbers on short lists).
 */
function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number,
): PageSlot[] {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Slots left for the moving window once first and last are reserved.
  const windowSize = Math.max(1, maxVisiblePages - 2);
  let start = Math.max(2, currentPage - Math.floor((windowSize - 1) / 2));
  let end = start + windowSize - 1;

  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = Math.max(2, end - windowSize + 1);
  }

  const pages: PageSlot[] = [1];
  if (start > 2) pages.push("gap-start");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("gap-end");
  pages.push(totalPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  label = "Pagination",
}: Readonly<PaginationProps>) {
  if (totalPages <= 1) return null;

  // A bookmarked `?page=99` can arrive before the list clamps it; render the
  // controls against a page that actually exists so Prev/Next stay usable.
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePages = getVisiblePages(page, totalPages, Math.max(3, maxVisiblePages));

  return (
    <nav
      aria-label={label}
      className="mt-6 flex items-center justify-center gap-2"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Button>

      {showPageNumbers && (
        <ul className="flex items-center gap-1">
          {visiblePages.map((slot) =>
            typeof slot === "number" ? (
              <li key={slot}>
                <Button
                  variant={slot === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(slot)}
                  aria-label={`Page ${slot}`}
                  aria-current={slot === page ? "page" : undefined}
                  className="h-9 w-9 p-0"
                >
                  {slot}
                </Button>
              </li>
            ) : (
              <li
                key={slot}
                aria-hidden
                className="px-2 text-muted-foreground"
              >
                …
              </li>
            ),
          )}
        </ul>
      )}

      {!showPageNumbers && (
        <span className="px-4 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </nav>
  );
}
