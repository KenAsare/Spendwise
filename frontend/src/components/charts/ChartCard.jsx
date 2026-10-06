export default function ChartCard({ title, action, children, height = 300 }) {
  return (
    <div className="card card-padded">
      <div className="flex items-center justify-between mb-16">
        <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
        {action}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}
