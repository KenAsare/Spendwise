import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { authAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function VerifyEmail() {
  useDocumentTitle('Verify email');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { updateUser, isAuthenticated } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token was found in this link.');
      return;
    }

    authAPI
      .verifyEmail({ token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
        // If this browser is already logged in as this user, reflect the
        // verified status immediately without needing a page refresh.
        if (isAuthenticated && res.data.data?.user) {
          updateUser(res.data.data.user);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(getErrorMessage(err));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      <div className="card card-padded" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div className="flex items-center gap-8 mb-16" style={{ justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDollarSign size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Spendwise</span>
        </div>

        {status === 'loading' && <LoadingSpinner label="Verifying your email..." />}

        {status === 'success' && (
          <>
            <div style={{ color: 'var(--success)', fontSize: 40, marginBottom: 8 }}>
              <FiCheckCircle />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Email verified</h2>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>{message}</p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-primary btn-full">
              {isAuthenticated ? 'Go to Dashboard' : 'Go to login'}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ color: 'var(--danger)', fontSize: 40, marginBottom: 8 }}>
              <FiXCircle />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Verification failed</h2>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>{message}</p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-secondary btn-full">
              {isAuthenticated ? 'Back to Dashboard' : 'Back to login'}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}