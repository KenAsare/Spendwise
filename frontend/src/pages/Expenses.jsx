import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiTrendingDown, FiDownload } from 'react-icons/fi';
import { expenseAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import { exportToCSV } from '../utils/exportCsv';
import { formatDate } from '../utils/format';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import TransactionTable from '../components/common/TransactionTable';
import Pagination from '../components/common/Pagination';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency } from '../utils/format';

const CATEGORIES = [
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];
const PAGE_SIZE = 20;

export default function Expenses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Expenses');
  const currency = user?.currency || 'GHS';

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sortBy: 'date', sortOrder, page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await expenseAPI.getAll(params);
      setRecords(res.data.data.expenses);
      setTotal(res.data.data.total);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, category, sortOrder, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, category, sortOrder]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        await expenseAPI.update(editing.id, form);
        showToast('Expense updated successfully');
      } else {
        await expenseAPI.create(form);
        showToast('Expense created successfully');
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
      await expenseAPI.remove(deleting.id);
      showToast('Expense deleted successfully');
      setDeleting(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { sortBy: 'date', sortOrder, page: 1, limit: 10000 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await expenseAPI.getAll(params);
      exportToCSV('spendwise-expenses', res.data.data.expenses, [
        { label: 'Date', accessor: (r) => formatDate(r.date) },
        { label: 'Category', accessor: (r) => r.category },
        { label: 'Description', accessor: (r) => r.description || '' },
        { label: 'Amount', accessor: (r) => r.amount },
      ]);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Total: <strong style={{ color: 'var(--expense)' }}>{formatCurrency(total, currency)}</strong>
          </p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" disabled={exporting} onClick={handleExport}>
            <FiDownload /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FiPlus /> Add Expense
          </button>
        </div>
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." />
        <select className="form-select" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="DESC">Newest first</option>
          <option value="ASC">Oldest first</option>
        </select>
      </FilterBar>

      <ErrorMessage message={error} />

      <div className="card">
        {loading ? (
          <LoadingSpinner label="Loading expenses..." />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<FiTrendingDown />}
            title="No expenses yet"
            message="Start tracking your spending by adding your first expense."
            actionLabel="Add Expense"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>
            <TransactionTable
              rows={records}
              currency={currency}
              onEdit={(row) => { setEditing(row); setShowForm(true); }}
              onDelete={(row) => setDeleting(row)}
            />
            <Pagination
              page={pagination.page || page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          initialData={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete expense"
          message={`Are you sure you want to delete this ${deleting.category} expense? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}