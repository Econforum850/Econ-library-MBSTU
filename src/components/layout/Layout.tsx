import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 selection:bg-brand-royal selection:text-white flex flex-col lg:flex-row">
      <Navbar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
