import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import VerificationBanner from './VerificationBanner';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // While the mobile drawer is open, stop the page behind it from scrolling.
  // If the window is resized to desktop width, close the drawer.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onResize = () => { if (window.innerWidth > 900) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('resize', onResize);
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <VerificationBanner />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}