import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/format';

// Shown on the Dashboard when any current-month budget is near its limit
// or already over. Purely derived from data already fetched for the
// dashboard — no extra API calls needed.
export default function BudgetAlertBanner({ budgetOverview, currency }) {
  const [dismissed, setDismissed] = useState(false);

  const overBudget = budgetOverview.filter((b) => b.status === 'Over budget');
  const nearLimit = budgetOverview.filter((b) => b.status === 'Near limit');

  if (dismissed || (overBudget.length === 0 && nearLimit.length === 0)) return null;

  const tone = overBudget.length > 0 ? 'danger' : 'warning';
  const toneVar = tone === 'danger' ? 'var(--danger)' : 'var(--warning)';
  const toneSoft = tone === 'danger' ? 'var(--danger-soft)' : 'var(--warning-soft)';

  return (
    <div
      className="card"
      style={{
        background: toneSoft,
        border: 'none',
        padding: '14px 20px',
        marginBottom: 20,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="flex items-start gap-8">
          <FiAlertTriangle style={{ color: toneVar, flexShrink: 0, marginTop: 2 }} />
          <div>
            {overBudget.map((b) => (
              <div key={b.id} style={{ fontSize: 13.5, color: toneVar, marginBottom: 4 }}>
                You're <strong>{formatCurrency(b.spent - b.amount, currency)} over</strong> your{' '}
                <strong>{b.category}</strong> budget this month.
              </div>
            ))}
            {nearLimit.map((b) => (
              <div key={b.id} style={{ fontSize: 13.5, color: toneVar, marginBottom: 4 }}>
                You've used <strong>{b.percentage}%</strong> of your <strong>{b.category}</strong> budget
                ({formatCurrency(b.spent, currency)} of {formatCurrency(b.amount, currency)}).
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: toneVar, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}