import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { authAPI, getErrorMessage } from '../services/api';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import ErrorMessage from '../components/common/ErrorMessage';
import PasswordInput from '../components/common/PasswordInput';

export default function ForgotPassword() {
  useDocumentTitle('Forgot password');
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authAPI.forgotPassword({ email });
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code from your email');
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
      await authAPI.resetPassword({ email, otp, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
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
            <p className="text-muted" style={{ fontSize: 14 }}>Taking you to the login page...</p>
          </div>
        ) : step === 1 ? (
          <>
            <h2 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 20 }}>Forgot your password?</h2>
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              Enter your email and we'll send you a 6-digit code.
            </p>

            <ErrorMessage message={error} />

            <form onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send code'}
              </button>
            </form>

            <p className="text-muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 20 }}>Enter your code</h2>
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
            </p>

            <ErrorMessage message={error} />

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label className="form-label">6-digit code</label>
                <input
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
                  maxLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
              >
                Use a different email
              </button>
              <button
                onClick={handleRequestCode}
                disabled={submitting}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Resend code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}