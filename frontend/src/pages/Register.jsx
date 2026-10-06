import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import ErrorMessage from '../components/common/ErrorMessage';
import PasswordInput from '../components/common/PasswordInput';

const validateField = (name, value, form) => {
  if (name === 'name') {
    if (!value.trim()) return 'Name is required';
  }
  if (name === 'email') {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
  }
  if (name === 'password') {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
  }
  if (name === 'confirmPassword') {
    if (value !== form.password) return 'Passwords do not match';
  }
  return '';
};

export default function Register() {
  useDocumentTitle('Sign up');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value, updatedForm) }));
    }
    // Re-check confirmPassword live if password itself changes after confirm was touched
    if (field === 'password' && touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', updatedForm.confirmPassword, updatedForm),
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, form[field], form) }));
  };

  const validateAll = () => {
    const errs = {
      name: validateField('name', form.name, form),
      email: validateField('email', form.email, form),
      password: validateField('password', form.password, form),
      confirmPassword: validateField('confirmPassword', form.confirmPassword, form),
    };
    setFieldErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    return !errs.name && !errs.email && !errs.password && !errs.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setSubmitting(true);
    const result = await register(form.name, form.email, form.password, form.confirmPassword);
    setSubmitting(false);
    if (result.success) {
      showToast('Account created successfully');
      navigate('/dashboard');
    } else {
      setError(result.message);
      if (result.errors) setFieldErrors(result.errors);
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
      <div className="card card-padded" style={{ width: '100%', maxWidth: 420 }}>
        <div className="flex items-center gap-8 mb-16" style={{ justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDollarSign size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Spendwise</span>
        </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 20 }}>Create your account</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Start tracking your finances in minutes
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Ama Owusu"
              style={fieldErrors.name ? { borderColor: 'var(--danger)' } : undefined}
            />
            {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              style={fieldErrors.email ? { borderColor: 'var(--danger)' } : undefined}
            />
            {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="At least 6 characters"
              style={fieldErrors.password ? { borderColor: 'var(--danger)' } : undefined}
            />
            {fieldErrors.password && <div className="form-error">{fieldErrors.password}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <PasswordInput
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Re-enter your password"
              style={fieldErrors.confirmPassword ? { borderColor: 'var(--danger)' } : undefined}
            />
            {fieldErrors.confirmPassword && <div className="form-error">{fieldErrors.confirmPassword}</div>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}