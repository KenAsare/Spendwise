import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}
    >
      <span className="text-muted" style={{ fontSize: 13 }}>
        Page {page} of {totalPages} &middot; {totalCount} total records
      </span>
      <div className="flex gap-8">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <FiChevronLeft size={15} /> Prev
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <FiChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}