import { ChevronLeft, Search, Moon, Bell, User, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentAdminUser } from '@/src/lib/adminAuth';

interface AdminTopBarProps {
  onMenuClick?: () => void;
}

export default function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getCurrentAdminUser();

  // Get current page name from path
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    switch(path) {
      case 'dashboard': return 'ওভারভিউ (Overview)';
      case 'profile': return 'আমার প্রোফাইল';
      case 'users': return 'সদস্য ব্যবস্থাপনা (Members)';
      case 'inventory': return 'বইয়ের তালিকা (Inventory)';
      case 'id-card': return 'আইডি কার্ড প্রিন্ট';
      case 'finance': return 'হিসাব-নিকাশ';
      case 'sub-admins': return 'মডারেটর ব্যবস্থাপনা ও অডিট লগ';
      default: return 'Admin Gateway';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Hamburger trigger for mobile sidebar */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          aria-label="Toggle Side Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all shrink-0"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>
        <h1 className="text-sm md:text-xl font-black text-slate-900 truncate max-w-[140px] sm:max-w-none">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="hidden md:flex relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="বই ব্রাউজ করুন" 
            className="w-72 pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center">
            <Moon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-2" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900">{admin.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {admin.role === 'super' ? 'সুপার অ্যাডমিন' : 'মডারেটর'}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100 shadow-sm">
            {admin.name.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
