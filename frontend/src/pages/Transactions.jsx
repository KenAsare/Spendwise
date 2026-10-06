import { useEffect, useState, useCallback } from 'react';
import { FiList, FiDownload } from 'react-icons/fi';
import { incomeAPI, expenseAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import { exportToCSV } from '../utils/exportCsv';
import { formatDate } from '../utils/format';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import TransactionTable from '../components/common/TransactionTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import ExpenseForm from '../components/expenses/ExpenseForm';
import IncomeForm from '../components/income/IncomeForm';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ALL_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Bonus',
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];

export default function Transactions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Transactions');
  const currency = user?.currency || 'GHS';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const requests = [];
      if (typeFilter === 'all' || typeFilter === 'income') requests.push(incomeAPI.getAll(params));
      if (typeFilter === 'all' || typeFilter === 'expense') requests.push(expenseAPI.getAll(params));

      const results = await Promise.all(requests);
      let combined = [];
      let idx = 0;
      if (typeFilter === 'all' || typeFilter === 'income') {
        combined = combined.concat(
          results[idx].data.data.income.map((i) => ({ ...i, type: 'income' }))
        );
        idx++;
      }
      if (typeFilter === 'all' || typeFilter === 'expense') {
        combined = combined.concat(
          results[idx].data.data.expenses.map((e) => ({ ...e, type: 'expense', amount: -Math.abs(e.amount) }))
        );
      }
      combined.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(combined);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, category, typeFilter, startDate, endDate]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  // Expenses are shown as negative numbers in this list, but the edit form
  // and the API expect the plain positive amount.
  const handleEdit = (row) =>
    setEditing({ ...row, amount: Math.abs(row.amount) });

  const apiFor = (row) => (row.type === 'income' ? incomeAPI : expenseAPI);
  const labelFor = (row) => (row.type === 'income' ? 'Income' : 'Expense');

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      await apiFor(editing).update(editing.id, form);
      showToast(`${labelFor(editing)} updated successfully`);
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
      await apiFor(deleting).remove(deleting.id);
      showToast(`${labelFor(deleting)} deleted successfully`);
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
          <h1 className="page-title" style={{ marginBottom: 4 }}>Transactions</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>All your income and expenses in one place.</p>
        </div>
        <button
          className="btn btn-secondary"
          disabled={transactions.length === 0}
          onClick={() =>
            exportToCSV('spendwise-transactions', transactions, [
              { label: 'Date', accessor: (r) => formatDate(r.date) },
              { label: 'Type', accessor: (r) => (r.type === 'income' ? 'Income' : 'Expense') },
              { label: 'Category', accessor: (r) => r.category },
              { label: 'Description', accessor: (r) => r.description || '' },
              { label: 'Amount', accessor: (r) => r.amount },
            ])
          }
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search transactions..." />
        <select className="form-select" style={{ maxWidth: 140 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <select className="form-select" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="form-input" type="date" style={{ maxWidth: 150 }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="form-input" type="date" style={{ maxWidth: 150 }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </FilterBar>

      <ErrorMessage message={error} />

      <div className="card">
        {loading ? (
          <LoadingSpinner label="Loading transactions..." />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<FiList />}
            title="No transactions found"
            message="Try adjusting your filters, or add some income and expenses."
          />
        ) : (
          <TransactionTable
            rows={transactions}
            currency={currency}
            showType
            onEdit={handleEdit}
            onDelete={(row) => setDeleting(row)}
          />
        )}
      </div>

      {editing && editing.type === 'income' && (
        <IncomeForm
          initialData={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && editing.type === 'expense' && (
        <ExpenseForm
          initialData={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${labelFor(deleting).toLowerCase()}`}
          message={`Are you sure you want to delete this ${deleting.category} ${labelFor(deleting).toLowerCase()}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}