import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiPieChart, FiCopy } from 'react-icons/fi';
import { budgetAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import FilterBar from '../components/common/FilterBar';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetForm from '../components/budgets/BudgetForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { monthNames } from '../utils/format';

const CATEGORIES = [
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];

export default function Budgets() {
  const { user } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Budgets');
  const currency = user?.currency || 'GHS';
  const now = new Date();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { month, year };
      if (category) params.category = category;
      const res = await budgetAPI.getAll(params);
      setBudgets(res.data.data.budgets);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, year, category]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        await budgetAPI.update(editing.id, form);
        showToast('Budget updated successfully');
      } else {
        await budgetAPI.create(form);
        showToast('Budget created successfully');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await budgetAPI.remove(deleting.id);
      showToast('Budget deleted successfully');
      setDeleting(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Budget rollover: fetch last month's budgets and re-create each one
  // (same category + amount) for the currently selected month/year.
  // Categories that already have a budget this month are skipped, since
  // the backend rejects duplicate category+month+year combinations.
  const handleCopyFromLastMonth = async () => {
    setCopying(true);
    setConfirmCopy(false);
    try {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const res = await budgetAPI.getAll({ month: prevMonth, year: prevYear });
      const previousBudgets = res.data.data.budgets;

      if (previousBudgets.length === 0) {
        showToast(`No budgets found in ${monthNames[prevMonth - 1]} ${prevYear} to copy`, 'error');
        return;
      }

      const existingCategories = new Set(budgets.map((b) => b.category));
      const toCreate = previousBudgets.filter((b) => !existingCategories.has(b.category));

      if (toCreate.length === 0) {
        showToast('All of last month\'s budget categories already exist this month');
        return;
      }

      await Promise.all(
        toCreate.map((b) =>
          budgetAPI.create({ category: b.category, amount: b.amount, month, year })
        )
      );

      showToast(`Copied ${toCreate.length} budget${toCreate.length > 1 ? 's' : ''} from last month`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setCopying(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div>
      <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Plan and track your monthly spending by category.</p>
        </div>
        <div className="flex gap-8">
          <button
            className="btn btn-secondary"
            onClick={() => setConfirmCopy(true)}
            disabled={copying}
          >
            <FiCopy /> {copying ? 'Copying...' : 'Copy from last month'}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FiPlus /> Create Budget
          </button>
        </div>
      </div>

      <FilterBar>
        <select className="form-select" style={{ maxWidth: 160 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {monthNames.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 120 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterBar>

      <ErrorMessage message={error} />

      {loading ? (
        <LoadingSpinner label="Loading budgets..." />
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiPieChart />}
            title="No budgets for this period"
            message="Create a budget to start tracking your spending against a plan, or copy last month's budgets forward."
            actionLabel="Create Budget"
            onAction={() => setShowForm(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              currency={currency}
              onEdit={(bud) => { setEditing(bud); setShowForm(true); }}
              onDelete={(bud) => setDeleting(bud)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BudgetForm
          initialData={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete budget"
          message={`Are you sure you want to delete the ${deleting.category} budget? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {confirmCopy && (
        <ConfirmDialog
          title="Copy budgets from last month"
          message={`This will create a new budget for ${monthNames[month - 1]} ${year} for each category budgeted last month that doesn't already have one here. Continue?`}
          confirmLabel="Copy budgets"
          danger={false}
          onConfirm={handleCopyFromLastMonth}
          onCancel={() => setConfirmCopy(false)}
        />
      )}
    </div>
  );
}