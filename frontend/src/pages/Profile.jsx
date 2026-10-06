import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/Usedocumenttitle';
import { authAPI, getErrorMessage } from '../services/api';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  useDocumentTitle('Profile');

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.data.user);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword(passwordForm);
      showToast('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : 'U';

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Manage your personal information and password.</p>

      <div className="grid profile-layout">
        <div className="card card-padded" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700,
              margin: '0 auto 14px',
            }}
          >
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div>
          <div className="text-muted" style={{ fontSize: 14 }}>{user?.email}</div>
          <hr className="divider" />
          <div className="text-muted" style={{ fontSize: 13 }}>
            Member since {formatDate(user?.createdAt)}
          </div>
        </div>

        <div>
          <div className="card card-padded mb-16">
            <h3 className="section-title">Personal information</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="card card-padded">
            <h3 className="section-title">Change password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current password</label>
                <input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New password</label>
                  <input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm new password</label>
                  <input className="form-input" type="password" value={passwordForm.confirmNewPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}