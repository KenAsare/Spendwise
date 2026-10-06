export default function FilterBar({ children }) {
  return (
    <div className="filter-bar flex gap-12 mb-16" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {children}
    </div>
  );
}