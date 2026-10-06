import { useState } from 'react';
import Modal from '../common/Modal';

export default function GoalForm({ initialData, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    targetAmount: initialData?.targetAmount ?? '',
    targetDate: initialData?.targetDate ?? '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Goal name is required';
    if (!form.targetAmount || Number(form.targetAmount) <= 0) errs.targetAmount = 'Enter a valid positive amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <Modal title={initialData ? 'Edit Goal' : 'New Savings Goal'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Goal name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. New laptop, Emergency fund"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Target amount</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            placeholder="0.00"
          />
          {errors.targetAmount && <div className="form-error">{errors.targetAmount}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Target date (optional)</label>
          <input
            className="form-input"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
        </div>

        <div className="flex gap-12" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}