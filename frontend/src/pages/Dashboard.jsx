import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiTarget,
} from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import useIsMobile from '../hooks/useIsMobile';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/charts/ChartCard';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetAlertBanner from '../components/budgets/BudgetAlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

const PIE_COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9', '#65a30d'];

export default function Dashboard() {
  const { user } = useAuth();
  useDocumentTitle('Dashboard');
  const isMobile = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .get()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (!data) return <EmptyState title="Couldn't load dashboard" message="Please try refreshing the page." />;

  const { summary, recentTransactions, monthlyTrend, expenseByCategory, budgetOverview, financialSummary } = data;
  const currency = user?.currency || 'GHS';

  return (
    <div>
      <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="page-subtitle">Here's what's happening with your money.</p>

      <BudgetAlertBanner budgetOverview={budgetOverview} currency={currency} />

      <div className="grid grid-cols-5 mb-16">
        <StatCard label="Total Income" value={formatCurrency(summary.totalIncome, currency)} icon={<FiTrendingUp />} tone="success" />
        <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenses, currency)} icon={<FiTrendingDown />} tone="danger" />
        <StatCard label="Current Balance" value={formatCurrency(summary.balance, currency)} icon={<FiDollarSign />} tone={summary.balance >= 0 ? 'success' : 'danger'} />
        <StatCard label="Total Budget" value={formatCurrency(summary.totalBudget, currency)} icon={<FiPieChart />} />
        <StatCard label="Remaining Budget" value={formatCurrency(summary.remainingBudget, currency)} icon={<FiTarget />} tone={summary.remainingBudget >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="grid two-col-wide-narrow mb-16">
        <ChartCard title="Income vs Expenses (last 6 months)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--text-faint)" />
              <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense by Category">
          {expenseByCategory.length === 0 ? (
            <EmptyState title="No expenses yet" message="Add an expense to see the breakdown." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 70 : 90}
                  label={isMobile ? false : (entry) => entry.category}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                {isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid two-col-even mb-16">
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-16">
            <h3 className="section-title" style={{ margin: 0 }}>Recent Transactions</h3>
            <Link to="/transactions" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyState title="No transactions yet" message="Add income or an expense to get started." />
          ) : (
            <div>
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.category}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{formatDate(t.date)}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: t.amount >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                    {t.amount >= 0 ? '+' : '−'}{formatCurrency(Math.abs(t.amount), currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-16">
            <h3 className="section-title" style={{ margin: 0 }}>Budget Overview</h3>
            <Link to="/budgets" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {budgetOverview.length === 0 ? (
            <div className="card card-padded">
              <EmptyState title="No budgets this month" message="Create a budget to track your spending." actionLabel="Create Budget" onAction={() => (window.location.href = '/budgets')} />
            </div>
          ) : (
            <div className="grid" style={{ gap: 12 }}>
              {budgetOverview.slice(0, 3).map((b) => (
                <BudgetCard key={b.id} budget={b} currency={currency} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card card-padded">
        <h3 className="section-title">Financial Summary</h3>
        <div className="grid grid-cols-4">
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>Highest spending category</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{financialSummary.highestExpenseCategory || '—'}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>Total transactions</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{financialSummary.totalTransactions}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>This month's income</div>
            <div style={{ fontWeight: 700, marginTop: 4, color: 'var(--income)' }}>{formatCurrency(financialSummary.currentMonthIncome, currency)}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>This month's balance</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{formatCurrency(financialSummary.currentMonthBalance, currency)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}