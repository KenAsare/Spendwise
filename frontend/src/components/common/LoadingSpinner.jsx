export default function LoadingSpinner({ label }) {
  return (
    <div className="flex items-center gap-12" style={{ padding: 24, justifyContent: 'center' }}>
      <div className="spinner" />
      {label && <span className="text-muted">{label}</span>}
    </div>
  );
}
