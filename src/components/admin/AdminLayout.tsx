import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import { isAdminAuthenticated } from '@/src/lib/adminAuth';

export default function AdminLayout() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsAuthorized(isAdminAuthenticated());
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 relative print:bg-white print:block">
      <div className="print:hidden shrink-0">
        <AdminSidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>
      
      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-45 lg:hidden transition-opacity duration-300 print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 print:block">
        <div className="print:hidden">
          <AdminTopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
        <main className="flex-1 p-4 md:p-8 print:p-0 print:m-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
