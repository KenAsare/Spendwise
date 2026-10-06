import { useState } from 'react';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI, getErrorMessage } from '../../services/api';

export default function VerificationBanner() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [otp, setOtp] = useState('');

  if (!user || user.isVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await authAPI.resendVerification();
      showToast(res.data.message);
      setShowCodeInput(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      showToast('Enter the 6-digit code from your email', 'error');
      return;
    }
    setVerifying(true);
    try {
      const res = await authAPI.verifyEmail({ otp });
      updateUser(res.data.data.user);
      showToast('Email verified successfully');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--warning-soft)',
        color: 'var(--warning)',
        padding: '10px 24px',
        fontSize: 13.5,
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="flex items-center gap-8">
          <FiMail size={16} />
          <span>Please verify your email address to secure your account.</span>
        </div>
        <div className="flex items-center gap-12">
          {!showCodeInput && (
            <button
              onClick={handleResend}
              disabled={sending}
              style={{ background: 'none', border: 'none', color: 'var(--warning)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: 13.5 }}
            >
              {sending ? 'Sending...' : 'Send verification code'}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: 13.5 }}
          >
            Dismiss
          </button>
        </div>
      </div>

      {showCodeInput && (
        <form onSubmit={handleVerify} className="flex items-center gap-8" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            inputMode="numeric"
            maxLength={6}
            style={{ maxWidth: 180, letterSpacing: 3 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={verifying}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            style={{ background: 'none', border: 'none', color: 'var(--warning)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Resend code
          </button>
        </form>
      )}
    </div>
  );
}