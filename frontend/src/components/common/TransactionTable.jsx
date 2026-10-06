import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';

export default function TransactionTable({ rows, currency, onView, onEdit, onDelete, showType = false }) {
  return (
    <div className="table-scroll">
      <table className="data-table responsive">
        <thead>
          <tr>
            {showType && <th>Type</th>}
            <th>Category</th>
            <th>Description</th>
            <th>Date</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpense = row.type === 'expense' || row.amount < 0;
            const displayAmount = Math.abs(row.amount ?? row.amount === 0 ? row.amount : row.amount);
            return (
              <tr key={row.id}>
                {showType && (
                  <td data-label="Type">
                    <span className={`badge ${isExpense ? 'badge-danger' : 'badge-success'}`}>
                      {isExpense ? 'Expense' : 'Income'}
                    </span>
                  </td>
                )}
                <td data-label="Category">{row.category}</td>
                <td className="text-muted" data-label="Description">{row.description || '—'}</td>
                <td className="text-muted" data-label="Date">{formatDate(row.date)}</td>
                <td
                  data-label="Amount"
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: isExpense ? 'var(--expense)' : 'var(--income)',
                  }}
                >
                  {isExpense ? '−' : '+'}
                  {formatCurrency(Math.abs(row.amount), currency)}
                </td>
                <td className="cell-actions" data-label="Actions">
                  <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
                    {onView && (
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onView(row)} aria-label="View">
                        <FiEye size={15} />
                      </button>
                    )}
                    {onEdit && (
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEdit(row)} aria-label="Edit">
                        <FiEdit2 size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onDelete(row)} aria-label="Delete">
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}