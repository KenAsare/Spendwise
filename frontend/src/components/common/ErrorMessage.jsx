import { FiAlertTriangle } from 'react-icons/fi';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-8"
      style={{
        background: 'var(--danger-soft)',
        color: 'var(--danger)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
        marginBottom: 16,
      }}
    >
      <FiAlertTriangle />
      <span>{message}</span>
    </div>
  );
}
