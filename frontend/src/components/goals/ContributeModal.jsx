import { useState } from 'react';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils/format';

export default function ContributeModal({ goal, mode, currency, onSubmit, onClose, submitting }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const isContribute = mode === 'contribute';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    onSubmit(Number(amount));
  };

  return (
    <Modal title={isContribute ? 'Add Funds' : 'Withdraw Funds'} onClose={onClose}>
      <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
        {goal.name} — currently {formatCurrency(goal.currentAmount, currency)} of {formatCurrency(goal.targetAmount, currency)} saved.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount to {isContribute ? 'add' : 'withdraw'}</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            placeholder="0.00"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isContribute ? 'Add funds' : 'Withdraw'}
          </button>
        </div>
      </form>
    </Modal>
  );
}