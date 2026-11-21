import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  compact?: boolean;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  compact = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ds-divider text-xs ds-muted select-none">
      <div className="flex items-center gap-3">
        <span className="font-mono">
          {totalItems === 0 ? '0 registos' : `A mostrar ${start}–${end} de ${totalItems}`}
        </span>
        {onPageSizeChange && !compact && (
          <select
            aria-label="Itens por página"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="input h-7 w-auto text-xs py-0 px-2"
          >
            <option value={10}>10 / pág</option>
            <option value={25}>25 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="btn btn-secondary btn-sm h-7 px-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {!compact && <span>Anterior</span>}
        </button>

        <span className="px-2.5 font-mono text-[11px] text-[rgb(var(--text))]">
          {safePage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="btn btn-secondary btn-sm h-7 px-2.5"
        >
          {!compact && <span>Próximo</span>}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
