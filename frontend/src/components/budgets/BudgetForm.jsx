import { useState } from 'react';
import Modal from '../common/Modal';
import { monthNames } from '../../utils/format';

const CATEGORIES = [
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];

export default function BudgetForm({ initialData, onSubmit, onClose, submitting }) {
  const now = new Date();
  const [form, setForm] = useState({
    category: initialData?.category ?? '',
    amount: initialData?.amount ?? '',
    month: initialData?.month ?? now.getMonth() + 1,
    year: initialData?.year ?? now.getFullYear(),
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.category) errs.category = 'Category is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid positive amount';
    if (!form.month) errs.month = 'Month is required';
    if (!form.year) errs.year = 'Year is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <Modal title={initialData ? 'Edit Budget' : 'Create Budget'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <div className="form-error">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Budget amount</label>
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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Month</label>
            <select
              className="form-select"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input
              className="form-input"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex gap-12" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Save changes' : 'Create budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
