import { useState } from 'react';
import Modal from '../common/Modal';
import { todayISO } from '../../utils/format';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Bonus', 'Other'];
const EXPENSE_CATEGORIES = [
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];

export default function RecurringForm({ onSubmit, onClose, submitting }) {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    dayOfMonth: 1,
    startDate: todayISO(),
  });
  const [errors, setErrors] = useState({});

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid positive amount';
    if (!form.category) errs.category = 'Category is required';
    if (!form.dayOfMonth || form.dayOfMonth < 1 || form.dayOfMonth > 31) errs.dayOfMonth = 'Must be between 1 and 31';
    if (!form.startDate) errs.startDate = 'Start date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <Modal title="New Recurring Transaction" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Type</label>
          <div className="flex gap-12">
            <button
              type="button"
              className={form.type === 'expense' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setForm({ ...form, type: 'expense', category: '' })}
              style={{ flex: 1 }}
            >
              Expense
            </button>
            <button
              type="button"
              className={form.type === 'income' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setForm({ ...form, type: 'income', category: '' })}
              style={{ flex: 1 }}
            >
              Income
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
          {errors.amount && <div className="form-error">{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <div className="form-error">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <input
            className="form-input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Monthly rent"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Repeats on day</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="31"
              value={form.dayOfMonth}
              onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
            />
            {errors.dayOfMonth && <div className="form-error">{errors.dayOfMonth}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Starting from</label>
            <input
              className="form-input"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            {errors.startDate && <div className="form-error">{errors.startDate}</div>}
          </div>
        </div>

        <p className="text-muted" style={{ fontSize: 12.5, marginTop: -4, marginBottom: 16 }}>
          If the start date is in the past, any months already due will be created immediately.
        </p>

        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Create recurring transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}