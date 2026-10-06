import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiAlertTriangle } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import { authAPI, getErrorMessage } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';

const CURRENCIES = [
  { code: 'GHS', label: 'Ghana Cedi (₵)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Settings');
  const navigate = useNavigate();

  const [currency, setCurrency] = useState(user?.currency || 'GHS');
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleCurrencySave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateSettings({ currency });
      updateUser(res.data.data.user);
      showToast('Settings updated successfully');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await authAPI.deleteAccount({ password: deletePassword });
      showToast('Your account has been deleted');
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setShowFinalConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Customize how Spendwise looks and behaves.</p>

      <div className="card card-padded mb-16">
        <h3 className="section-title">Appearance</h3>
        <div className="flex gap-12">
          <button
            className={theme === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTheme('light')}
          >
            <FiSun /> Light
          </button>
          <button
            className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTheme('dark')}
          >
            <FiMoon /> Dark
          </button>
        </div>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          Your theme preference is saved on this device.
        </p>
      </div>

      <div className="card card-padded mb-16">
        <h3 className="section-title">Currency</h3>
        <div className="form-group" style={{ maxWidth: 320 }}>
          <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleCurrencySave} disabled={saving}>
          {saving ? 'Saving...' : 'Save currency preference'}
        </button>
      </div>

      <div className="card card-padded" style={{ borderColor: 'var(--danger)' }}>
        <div className="flex items-center gap-8 mb-16">
          <FiAlertTriangle style={{ color: 'var(--danger)' }} />
          <h3 className="section-title" style={{ margin: 0, color: 'var(--danger)' }}>Danger Zone</h3>
        </div>
        <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
          Deleting your account permanently removes your profile and every income, expense, and
          budget record you've created. This cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete my account
        </button>
      </div>

      {showDeleteModal && (
        <Modal
          title="Delete your account"
          onClose={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
        >
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>
            This will permanently delete your account and all of your financial data. Enter your
            password to confirm.
          </p>
          {deleteError && <div className="form-error" style={{ marginBottom: 12 }}>{deleteError}</div>}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              disabled={!deletePassword}
              onClick={() => { setShowDeleteModal(false); setShowFinalConfirm(true); }}
            >
              Continue
            </button>
          </div>
        </Modal>
      )}

      {showFinalConfirm && (
        <ConfirmDialog
          title="Are you absolutely sure?"
          message="This is your last chance to back out. Your account and all financial records will be permanently deleted."
          confirmLabel={deleting ? 'Deleting...' : 'Yes, delete everything'}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowFinalConfirm(false)}
        />
      )}
    </div>
  );
}