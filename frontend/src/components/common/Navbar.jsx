import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSun, FiMoon, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ConfirmDialog from './ConfirmDialog';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
      className="app-navbar flex items-center justify-between"
    >
      <button className="btn btn-icon btn-ghost mobile-menu-btn" onClick={onMenuClick} style={{ display: 'none' }}>
        <FiMenu size={20} />
      </button>

      <div className="flex items-center gap-8" style={{ marginLeft: 'auto' }}>
        <button className="btn btn-icon btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-8"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} className="hide-mobile">
              {user?.name}
            </span>
          </button>

          {menuOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                minWidth: 180,
                padding: 6,
                zIndex: 60,
              }}
            >
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              >
                <FiUser size={16} /> Profile
              </button>
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              >
                <FiSettings size={16} /> Settings
              </button>
              <hr className="divider" style={{ margin: '4px 0' }} />
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}
                onClick={() => { setMenuOpen(false); setConfirmingLogout(true); }}
              >
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmingLogout && (
        <ConfirmDialog
          title="Log out"
          message="Are you sure you want to log out of Spendwise?"
          confirmLabel="Logout"
          onConfirm={() => { setConfirmingLogout(false); logout(); }}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </header>
  );
}