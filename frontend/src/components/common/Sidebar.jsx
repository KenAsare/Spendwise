import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiList,
  FiBarChart2,
  FiRepeat,
  FiTarget,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
  FiDollarSign,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/income', label: 'Income', icon: FiTrendingUp },
  { to: '/expenses', label: 'Expenses', icon: FiTrendingDown },
  { to: '/budgets', label: 'Budgets', icon: FiPieChart },
  { to: '/recurring', label: 'Recurring', icon: FiRepeat },
  { to: '/goals', label: 'Goals', icon: FiTarget },
  { to: '/transactions', label: 'Transactions', icon: FiList },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 90,
          }}
          className="sidebar-backdrop"
        />
      )}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 250,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'transform 0.2s ease',
          transform: open ? 'translateX(0)' : undefined,
        }}
        className={`app-sidebar ${open ? 'open' : ''}`}
      >
        <div className="flex items-center justify-between" style={{ padding: '20px 20px 16px' }}>
          <div className="flex items-center gap-8">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiDollarSign size={17} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Spendwise</span>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} style={{ display: 'none' }} id="sidebar-close">
            <FiX />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 2,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                background: isActive ? 'var(--primary-soft)' : 'transparent',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}
            onClick={() => setConfirmingLogout(true)}
          >
            <FiLogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {confirmingLogout && (
        <ConfirmDialog
          title="Log out"
          message="Are you sure you want to log out of Spendwise?"
          confirmLabel="Logout"
          onConfirm={() => { setConfirmingLogout(false); logout(); }}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </>
  );
}