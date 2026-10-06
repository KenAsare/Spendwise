import { Link } from 'react-router-dom';
import { FiDollarSign, FiPieChart, FiTrendingUp, FiShield } from 'react-icons/fi';

const features = [
  { icon: FiTrendingUp, title: 'Track income & expenses', text: 'Log every cedi coming in and going out, organized by category and date.' },
  { icon: FiPieChart, title: 'Smart budgets', text: 'Set monthly budgets per category and watch real-time progress bars keep you honest.' },
  { icon: FiShield, title: 'Private & secure', text: 'Your financial data is yours alone — protected with JWT auth and hashed passwords.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="landing-header flex items-center justify-between" style={{ padding: '20px 32px' }}>
        <div className="flex items-center gap-8">
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDollarSign size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Spendwise</span>
        </div>
        <div className="flex gap-12">
          <Link to="/login" className="btn btn-secondary">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px' }}>
          Take control of your money, <span style={{ color: 'var(--primary)' }}>one cedi at a time.</span>
        </h1>
        <p className="text-muted" style={{ fontSize: 17, maxWidth: 560, margin: '0 auto 32px' }}>
          Spendwise helps you track income, manage expenses, set budgets, and understand your
          finances with clear, real-time reports and charts.
        </p>
        <div className="flex gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px' }}>Create free account</Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 28px' }}>I already have an account</Link>
        </div>

        <div className="grid grid-cols-3 mt-16" style={{ marginTop: 56, textAlign: 'left' }}>
          {features.map(({ icon: Icon, title, text }) => (
            <div className="card card-padded" key={title}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={19} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}