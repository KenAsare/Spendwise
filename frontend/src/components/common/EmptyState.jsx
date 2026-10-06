import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 36, color: 'var(--text-faint)' }}>
        {icon || <FiInbox />}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary mt-16" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
