export default function StatCard({ label, value, icon, tone = 'default', sub }) {
  const toneColors = {
    default: 'var(--primary)',
    success: 'var(--success)',
    danger: 'var(--danger)',
    warning: 'var(--warning)',
  };
  return (
    <div className="card card-padded">
      <div className="flex items-center justify-between mb-16">
        <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `color-mix(in srgb, ${toneColors[tone]} 15%, transparent)`,
            color: toneColors[tone],
          }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}