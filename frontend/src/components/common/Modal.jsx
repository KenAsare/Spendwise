import { FiX } from 'react-icons/fi';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
