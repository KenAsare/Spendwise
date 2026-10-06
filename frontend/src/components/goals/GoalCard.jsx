import { FiEdit2, FiTrash2, FiPlusCircle, FiMinusCircle, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';

export default function GoalCard({ goal, currency, onEdit, onDelete, onContribute, onWithdraw }) {
  return (
    <div className="card card-padded">
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 15, wordBreak: 'break-word' }}>{goal.name}</div>
        {goal.achieved && (
          <span className="badge badge-success" style={{ flexShrink: 0 }}>
            <FiCheckCircle size={12} /> Achieved
          </span>
        )}
      </div>

      <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
        {formatCurrency(goal.currentAmount, currency)} of {formatCurrency(goal.targetAmount, currency)}
        {goal.targetDate && <> &middot; by {formatDate(goal.targetDate)}</>}
      </div>

      <div className="progress-track mt-16">
        <div
          className="progress-fill"
          style={{
            width: `${goal.percentage}%`,
            background: goal.achieved ? 'var(--success)' : 'var(--primary)',
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-16" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="text-muted" style={{ fontSize: 13 }}>{goal.percentage}% saved</span>
        <div className="flex gap-8">
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onContribute(goal)} aria-label="Add funds" title="Add funds">
            <FiPlusCircle size={15} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onWithdraw(goal)} aria-label="Withdraw" title="Withdraw">
            <FiMinusCircle size={15} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEdit(goal)} aria-label="Edit">
            <FiEdit2 size={15} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onDelete(goal)} aria-label="Delete">
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}