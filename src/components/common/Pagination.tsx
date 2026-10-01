import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when user selects a new page */
  onPageChange: (page: number) => void;
  /** Total number of items (optional, shown in info text) */
  totalItems?: number;
  /** Number of items per page (optional, shown in info text) */
  pageSize?: number;
  /** Show "Showing X–Y of Z" info text */
  showInfo?: boolean;
  /** Compact mode hides page numbers on small screens */
  compact?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  showInfo = true,
  compact = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Calculate the range of page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = compact ? 3 : 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if there aren't too many
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      // Calculate middle range
      let rangeStart = Math.max(2, currentPage - Math.floor(maxVisible / 2));
      const rangeEnd = Math.min(totalPages - 1, rangeStart + maxVisible - 1);

      // Adjust if range is near the end
      if (rangeEnd === totalPages - 1) {
        rangeStart = Math.max(2, rangeEnd - maxVisible + 1);
      }

      // Add leading ellipsis
      if (rangeStart > 2) {
        pages.push('ellipsis');
      }

      // Add middle pages
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }

      // Add trailing ellipsis
      if (rangeEnd < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Calculate info text
  const getInfoText = () => {
    if (!showInfo || totalItems === undefined || pageSize === undefined) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return `Showing ${start}–${end} of ${totalItems.toLocaleString('en-IN')}`;
  };

  const pageNumbers = getPageNumbers();
  const infoText = getInfoText();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
      {/* Info Text */}
      {infoText ? (
        <p className="text-xs text-slate-500 font-medium order-2 sm:order-1">
          {infoText}
        </p>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First Page */}
        {!compact && (
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onPageChange(1)}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Previous */}
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onPageChange(currentPage - 1)}
          className="relative inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-0.5 mx-1">
          {pageNumbers.map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400 select-none"
              >
                ···
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`relative inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold transition-all duration-200
                  ${
                    page === currentPage
                      ? 'bg-[#315bd1] text-white shadow-sm shadow-[#315bd1]/25 scale-105'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="relative inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        {!compact && (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(totalPages)}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
