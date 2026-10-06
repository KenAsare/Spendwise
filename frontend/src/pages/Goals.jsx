import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiTarget } from 'react-icons/fi';
import { savingsGoalAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import GoalForm from '../components/goals/GoalForm';
import GoalCard from '../components/goals/GoalCard';
import ContributeModal from '../components/goals/ContributeModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

export default function Goals() {
  const { user } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Savings Goals');
  const currency = user?.currency || 'GHS';

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [fundsModal, setFundsModal] = useState(null); // { goal, mode: 'contribute' | 'withdraw' }
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await savingsGoalAPI.getAll();
      setGoals(res.data.data.goals);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        await savingsGoalAPI.update(editing.id, form);
        showToast('Goal updated successfully');
      } else {
        await savingsGoalAPI.create(form);
        showToast('Goal created successfully');
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
      await savingsGoalAPI.remove(deleting.id);
      showToast('Goal deleted successfully');
      setDeleting(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleFundsSubmit = async (amount) => {
    setSubmitting(true);
    try {
      if (fundsModal.mode === 'contribute') {
        await savingsGoalAPI.contribute(fundsModal.goal.id, amount);
        showToast('Funds added successfully');
      } else {
        await savingsGoalAPI.withdraw(fundsModal.goal.id, amount);
        showToast('Withdrawal recorded');
      }
      setFundsModal(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Save toward something specific, separate from your monthly budgets.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <FiPlus /> New Goal
        </button>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <LoadingSpinner label="Loading savings goals..." />
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiTarget />}
            title="No savings goals yet"
            message="Set a target — like a new laptop or an emergency fund — and track your progress toward it."
            actionLabel="New Goal"
            onAction={() => { setEditing(null); setShowForm(true); }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              onEdit={(g) => { setEditing(g); setShowForm(true); }}
              onDelete={(g) => setDeleting(g)}
              onContribute={(g) => setFundsModal({ goal: g, mode: 'contribute' })}
              onWithdraw={(g) => setFundsModal({ goal: g, mode: 'withdraw' })}
            />
          ))}
        </div>
      )}

      {showForm && (
        <GoalForm
          initialData={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete savings goal"
          message={`Are you sure you want to delete "${deleting.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {fundsModal && (
        <ContributeModal
          goal={fundsModal.goal}
          mode={fundsModal.mode}
          currency={currency}
          submitting={submitting}
          onSubmit={handleFundsSubmit}
          onClose={() => setFundsModal(null)}
        />
      )}
    </div>
  );
}