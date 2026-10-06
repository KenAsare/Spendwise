import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/format';

const statusColor = (status) => {
  if (status === 'Over budget') return 'var(--danger)';
  if (status === 'Near limit') return 'var(--warning)';
  return 'var(--success)';
};
const statusBadgeClass = (status) => {
  if (status === 'Over budget') return 'badge badge-danger';
  if (status === 'Near limit') return 'badge badge-warning';
  return 'badge badge-success';
};

export default function BudgetCard({ budget, currency, onEdit, onDelete }) {
  const pct = Math.min(budget.percentage, 100);
  return (
    <div className="card card-padded">
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontWeight: 600 }}>{budget.category}</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.amount, currency)}
          </div>
        </div>
        <span className={statusBadgeClass(budget.status)}>{budget.status}</span>
      </div>

      <div className="progress-track mt-16">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: statusColor(budget.status) }}
        />
      </div>

      <div className="flex items-center justify-between mt-16" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="text-muted" style={{ fontSize: 13 }}>{budget.percentage}% used</span>
        <div className="flex gap-8">
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEdit(budget)} aria-label="Edit budget">
            <FiEdit2 size={15} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onDelete(budget)} aria-label="Delete budget">
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}