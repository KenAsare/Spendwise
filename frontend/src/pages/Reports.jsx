import { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import FilterBar from '../components/common/FilterBar';
import ChartCard from '../components/charts/ChartCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency, monthNames } from '../utils/format';

const TABS = [
  { id: 'monthly', label: 'Monthly Financial' },
  { id: 'income', label: 'Income Report' },
  { id: 'expenses', label: 'Expense Report' },
  { id: 'budgets', label: 'Budget Report' },
];

export default function Reports() {
  const { user } = useAuth();
  useDocumentTitle('Reports');
  const currency = user?.currency || 'GHS';
  const now = new Date();

  const [tab, setTab] = useState('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [useMonth, setUseMonth] = useState(true);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = useMonth ? { month, year } : { year };
      let res;
      if (tab === 'monthly') res = await reportAPI.getMonthly(params);
      else if (tab === 'income') res = await reportAPI.getIncome(params);
      else if (tab === 'expenses') res = await reportAPI.getExpenses(params);
      else res = await reportAPI.getBudgets(params);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, month, year, useMonth]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">Analyze your finances across income, expenses, and budgets.</p>

      <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar>
        <select className="form-select" style={{ maxWidth: 160 }} value={useMonth ? 'month' : 'year'} onChange={(e) => setUseMonth(e.target.value === 'month')}>
          <option value="month">By month</option>
          <option value="year">Full year</option>
        </select>
        {useMonth && (
          <select className="form-select" style={{ maxWidth: 160 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {monthNames.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
          </select>
        )}
        <select className="form-select" style={{ maxWidth: 120 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </FilterBar>

      <ErrorMessage message={error} />

      {loading ? (
        <LoadingSpinner label="Generating report..." />
      ) : (
        <>
          {tab === 'monthly' && data && <MonthlyReport data={data} currency={currency} />}
          {tab === 'income' && data && <IncomeReport data={data} currency={currency} />}
          {tab === 'expenses' && data && <ExpenseReport data={data} currency={currency} />}
          {tab === 'budgets' && data && <BudgetReport data={data} currency={currency} />}
        </>
      )}
    </div>
  );
}

function SummaryGrid({ items }) {
  return (
    <div className="grid grid-cols-4 mb-16">
      {items.map(({ label, value, tone }) => (
        <div className="card card-padded" key={label}>
          <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginTop: 6, color: tone }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function MonthlyReport({ data, currency }) {
  return (
    <>
      <SummaryGrid
        items={[
          { label: 'Total Income', value: formatCurrency(data.totalIncome, currency), tone: 'var(--income)' },
          { label: 'Total Expenses', value: formatCurrency(data.totalExpenses, currency), tone: 'var(--expense)' },
          { label: 'Net Balance', value: formatCurrency(data.netBalance, currency) },
          { label: 'Total Transactions', value: data.totalTransactions },
        ]}
      />
      <div className="grid grid-cols-2">
        <div className="card card-padded">
          <div className="text-muted" style={{ fontSize: 12 }}>Highest spending category</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{data.highestSpendingCategory || '—'}</div>
        </div>
        <div className="card card-padded">
          <div className="text-muted" style={{ fontSize: 12 }}>Average expense</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{formatCurrency(data.averageExpense, currency)}</div>
        </div>
      </div>
    </>
  );
}

function IncomeReport({ data, currency }) {
  return (
    <>
      <SummaryGrid
        items={[
          { label: 'Total Income', value: formatCurrency(data.total, currency), tone: 'var(--income)' },
          { label: 'Records', value: data.count },
          { label: 'Average', value: formatCurrency(data.average, currency) },
        ]}
      />
      <ChartCard title="Income by Category" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
            <Tooltip formatter={(v) => formatCurrency(v, currency)} />
            <Line type="monotone" dataKey="amount" stroke="var(--income)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function ExpenseReport({ data, currency }) {
  return (
    <>
      <SummaryGrid
        items={[
          { label: 'Total Expenses', value: formatCurrency(data.total, currency), tone: 'var(--expense)' },
          { label: 'Records', value: data.count },
          { label: 'Average', value: formatCurrency(data.average, currency) },
          { label: 'Top Category', value: data.highestCategory || '—' },
        ]}
      />
      <ChartCard title="Expense Trend by Category" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
            <Tooltip formatter={(v) => formatCurrency(v, currency)} />
            <Line type="monotone" dataKey="amount" stroke="var(--expense)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function BudgetReport({ data, currency }) {
  if (!data.report || data.report.length === 0) {
    return <div className="card card-padded text-muted">No budgets found for this period.</div>;
  }
  return (
    <div className="card">
      <div className="table-scroll">
        <table className="data-table responsive">
          <thead>
            <tr>
              <th>Category</th>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Budget</th>
              <th style={{ textAlign: 'right' }}>Spent</th>
              <th style={{ textAlign: 'right' }}>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.report.map((r) => (
              <tr key={r.id}>
                <td data-label="Category">{r.category}</td>
                <td className="text-muted" data-label="Period">{monthNames[r.month - 1]} {r.year}</td>
                <td data-label="Budget" style={{ textAlign: 'right' }}>{formatCurrency(r.amount, currency)}</td>
                <td data-label="Spent" style={{ textAlign: 'right' }}>{formatCurrency(r.spent, currency)}</td>
                <td data-label="Remaining" style={{ textAlign: 'right' }}>{formatCurrency(r.remaining, currency)}</td>
                <td data-label="Status">
                  <span className={`badge ${r.status === 'Over budget' ? 'badge-danger' : r.status === 'Near limit' ? 'badge-warning' : 'badge-success'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}