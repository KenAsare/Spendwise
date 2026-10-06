import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { authAPI, getErrorMessage } from '../services/api';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ResetPassword() {
  useDocumentTitle('Reset password');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 16,
      }}
    >
      <div className="card card-padded" style={{ width: '100%', maxWidth: 400 }}>
        <div className="flex items-center gap-8 mb-16" style={{ justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDollarSign size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Spendwise</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', fontSize: 40, marginBottom: 8 }}>
              <FiCheckCircle />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Password reset</h2>
            <p className="text-muted" style={{ fontSize: 14 }}>
              Taking you to the login page...
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 20 }}>Set a new password</h2>
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              Choose a new password for your account.
            </p>

            <ErrorMessage message={error} />

            {!token && (
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
                No reset token was found in this link. Make sure you opened the full link from your email,
                or <Link to="/forgot-password" style={{ color: 'var(--primary)' }}>request a new one</Link>.
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting || !token}>
                {submitting ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <p className="text-muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}