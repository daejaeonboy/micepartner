import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type ContentPaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function ContentPagination({ currentPage, totalPages, onChange }: ContentPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="members-pagination">
      <button
        type="button"
        className="members-pagination__arrow"
        aria-label="첫 페이지"
        onClick={() => onChange(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft size={18} />
      </button>
      <button
        type="button"
        className="members-pagination__arrow"
        aria-label="이전 페이지"
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={18} />
      </button>

      {Array.from({ length: safeTotalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={page === currentPage ? 'members-pagination__button is-active' : 'members-pagination__button'}
          onClick={() => onChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="members-pagination__arrow"
        aria-label="다음 페이지"
        onClick={() => onChange(Math.min(safeTotalPages, currentPage + 1))}
        disabled={currentPage === safeTotalPages}
      >
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        className="members-pagination__arrow"
        aria-label="마지막 페이지"
        onClick={() => onChange(safeTotalPages)}
        disabled={currentPage === safeTotalPages}
      >
        <ChevronsRight size={18} />
      </button>
    </div>
  );
}
