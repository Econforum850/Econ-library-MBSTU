import { useNavigate, Link, useLocation } from 'react-router-dom';
import { setAdminAuthenticated, getCurrentAdminUser, checkSessionInactivity } from '@/src/lib/adminAuth';
import logoGold from '@/src/assets/images/logo_gold.png';
import { 
  User, LayoutDashboard, Users, BookOpen, QrCode, 
  Scan, ArrowLeftRight, ShoppingBag, Receipt, 
  Wallet, Heart, BarChart3, Settings, LogOut, 
  Search, ExternalLink, Calendar, Image, Shield
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useEffect } from 'react';

const menuItems = [
  { icon: User, label: 'আমার প্রোফাইল', path: '/admin/profile' },
  { icon: LayoutDashboard, label: 'ওভারভিউ (Overview)', path: '/admin/dashboard' },
  { icon: Users, label: 'সদস্য ব্যবস্থাপনা (Members)', path: '/admin/users' },
  { icon: BookOpen, label: 'বইয়ের তালিকা (Inventory)', path: '/admin/inventory' },
  { icon: QrCode, label: 'স্টিকার ও QR (Stickers)', path: '/admin/stickers' },
  { icon: Scan, label: 'বারকোড স্ক্যানার', path: '/admin/scanner' },
  { icon: ArrowLeftRight, label: 'ইস্যু ও ফেরত (Issues)', path: '/admin/issues' },
  { icon: ShoppingBag, label: 'বই ও শপ ব্যবস্থাপনা (Catalog)', path: '/admin/shop' },
  { icon: Receipt, label: 'বই ধার ও অর্ডার তালিকা (Borrow Request List)', path: '/admin/orders' },
  { icon: Wallet, label: 'সদস্যদের বকেয়া (Dues)', path: '/admin/dues' },
  { icon: Calendar, label: 'ইভেন্ট ও নোটিশ (Events)', path: '/admin/events' },
  { icon: Heart, label: 'দাতা সদস্য (Donors)', path: '/admin/donors' },
  { icon: Image, label: 'গ্রাফিক্স ও মিডিয়া (Graphics)', path: '/admin/graphics' },
  { icon: BarChart3, label: 'হিসাব-নিকাশ (Finances)', path: '/admin/finances' },
  { icon: Shield, label: 'মডারেটর ও অডিট লগ', path: '/admin/sub-admins', superOnly: true },
  { icon: Settings, label: 'ওয়েবসাইট সেটিংস', path: '/admin/settings', superOnly: true },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = getCurrentAdminUser();

  useEffect(() => {
    // Check session automatic inactivity
    const expired = checkSessionInactivity();
    if (expired) {
      alert('নিষ্ক্রিয়তার কারণে আপনার সেশনটি শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।');
      navigate('/admin/login');
    }
  }, [location, navigate]);

  // Filter items based on super admin permissions
  const filteredItems = menuItems.filter(item => {
    if (item.superOnly && admin.role !== 'super') {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-72 bg-[#0a0a1a] text-slate-400 flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-slate-800/50 scrollbar-none">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <Link to="/" className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1 border border-white/5 overflow-hidden shadow-inner">
            <img src={logoGold} alt="Library logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white leading-tight">Econ-library-MBSTU</span>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Admin Portal</span>
          </div>
        </Link>

        <div className="bg-white/5 rounded-2xl p-4 flex items-center space-x-4 mb-6 border border-white/5">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20 shadow-inner flex items-center justify-center bg-indigo-950 font-bold text-white text-base">
            {admin.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{admin.name}</p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              {admin.role === 'super' ? 'সুপার অ্যাডমিন 👑' : 'মডারেটর 🛡️'}
            </p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/10 shadow-sm" 
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className={cn(
                "text-xs font-black tracking-wide transition-all",
                isActive ? "text-indigo-400 font-extrabold" : "text-slate-400 group-hover:text-slate-100 font-bold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link 
          to="/" 
          className="flex items-center space-x-4 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Site</span>
        </Link>
        <button 
          onClick={() => {
            setAdminAuthenticated(false);
            navigate('/admin/login');
          }}
          className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-rose-500/70 hover:bg-rose-500/5 hover:text-rose-500 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-black">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
