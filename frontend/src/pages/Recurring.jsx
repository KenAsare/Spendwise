import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiRepeat, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi';
import { recurringAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import RecurringForm from '../components/recurring/RecurringForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';

export default function Recurring() {
  const { user } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Recurring');
  const currency = user?.currency || 'GHS';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await recurringAPI.getAll();
      setItems(res.data.data.recurring);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await recurringAPI.create(form);
      showToast('Recurring transaction created — any due months were generated automatically');
      setShowForm(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await recurringAPI.update(item.id, { active: !item.active });
      showToast(item.active ? 'Paused' : 'Resumed');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await recurringAPI.remove(deleting.id);
      showToast('Recurring transaction deleted');
      setDeleting(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Recurring Transactions</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Set up income or expenses that repeat every month — they'll be added automatically.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <FiPlus /> New Recurring
        </button>
      </div>

      <ErrorMessage message={error} />

      <div className="card">
        {loading ? (
          <LoadingSpinner label="Loading recurring transactions..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiRepeat />}
            title="No recurring transactions yet"
            message="Set up rent, salary, or any other repeating entry so you never have to add it manually again."
            actionLabel="New Recurring"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table responsive">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Repeats on</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Type">
                      <span className={`badge ${item.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {item.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td data-label="Category">{item.category}</td>
                    <td className="text-muted" data-label="Description">{item.description || '—'}</td>
                    <td className="text-muted" data-label="Repeats on">Day {item.dayOfMonth} of each month</td>
                    <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(item.amount, currency)}
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${item.active ? 'badge-success' : 'badge-neutral'}`}>
                        {item.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="cell-actions" data-label="Actions">
                      <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          onClick={() => handleToggleActive(item)}
                          aria-label={item.active ? 'Pause' : 'Resume'}
                          title={item.active ? 'Pause' : 'Resume'}
                        >
                          {item.active ? <FiPause size={15} /> : <FiPlay size={15} />}
                        </button>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          onClick={() => setDeleting(item)}
                          aria-label="Delete"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <RecurringForm
          submitting={submitting}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete recurring transaction"
          message={`Delete this recurring ${deleting.type}? Past entries it already created will NOT be removed, only the recurring rule itself.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}