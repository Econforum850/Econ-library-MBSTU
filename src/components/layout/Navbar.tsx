import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Globe, LogIn, Menu, X, BookOpen, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { isAdminAuthenticated } from '@/src/lib/adminAuth';

const navLinksBN = [
  { name: 'হোম', path: '/' },
  { name: 'বইসমূহ', path: '/books' },
  { name: 'ইভেন্ট', path: '/events' },
  { name: 'দাতা সদস্য', path: '/donors' },
];

const navLinksEN = [
  { name: 'Home', path: '/' },
  { name: 'Books', path: '/books' },
  { name: 'Events', path: '/events' },
  { name: 'Donors', path: '/donors' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'BN' | 'EN'>('BN');
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());
    const userStr = localStorage.getItem('loggedInUser');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("User parse error", e);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const links = lang === 'BN' ? navLinksBN : navLinksEN;

  return (
    <nav className="sticky top-0 z-[60] bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link to="/" id="nav-logo" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shadow-xl shadow-slate-100 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 overflow-hidden border border-slate-100/50 bg-white">
              <img src="/src/assets/images/logo_gold.png" alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-tight font-sans tracking-tight">ইকোলাইব্রেরি</span>
              <span className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">ECONOMICS MBSTU</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center bg-slate-50/50 p-1.5 rounded-[22px] border border-slate-100/50 mr-6">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-6 py-2.5 rounded-[18px] text-sm font-black transition-all",
                    location.pathname === link.path 
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100" 
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setLang(lang === 'BN' ? 'EN' : 'BN')}
                className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 rounded-[22px] text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all hover:border-indigo-200 shadow-sm"
              >
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>{lang}</span>
              </button>
              
              <div className="h-8 w-[2px] bg-slate-100 mx-1" />

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="px-6 py-3 bg-slate-900 text-white text-[11px] font-black rounded-[22px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>{lang === 'BN' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                </Link>
              )}

              {user ? (
                <Link 
                  to="/account" 
                  className="px-6 py-3 bg-emerald-500 text-white text-[11px] font-black rounded-[22px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center space-x-2"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <LogIn className="w-3 h-3 text-white" />
                  </div>
                  <span>{lang === 'BN' ? 'আমার প্রোফাইল' : 'Profile'}</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login"
                    className="px-6 py-3 text-slate-600 text-sm font-black hover:text-slate-900"
                  >
                    {lang === 'BN' ? 'লগইন' : 'Login'}
                  </Link>
                  <Link 
                    to="/register"
                    className="px-8 py-3 bg-indigo-600 text-white text-sm font-black rounded-[22px] hover:bg-slate-900 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                  >
                    {lang === 'BN' ? 'সদস্য হন' : 'Join Now'}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              id="mobile-menu-btn"
              className="p-3 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-indigo-50 bg-white border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 overflow-hidden shadow-2xl rounded-b-[40px]"
          >
            <div className="px-6 pt-6 pb-12 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-8 py-5 rounded-[25px] text-lg font-black transition-all",
                    location.pathname === link.path 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-8 border-t border-slate-100 mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setLang(lang === 'BN' ? 'EN' : 'BN');
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center space-x-3 py-5 bg-slate-50 text-slate-700 rounded-[25px] font-black"
                  >
                    <Globe className="w-5 h-5 text-indigo-500" />
                    <span>{lang}</span>
                  </button>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center space-x-3 py-5 bg-slate-900 text-white rounded-[25px] font-black"
                    >
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Admin</span>
                    </Link>
                  )}
                </div>

                {user ? (
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-3 py-5 bg-emerald-500 text-white rounded-[25px] font-black shadow-lg"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>প্রোফাইল (Account)</span>
                  </Link>
                ) : (
                  <div className="space-y-4">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-5 text-center bg-white border border-slate-200 text-slate-700 font-black rounded-[25px]"
                    >
                      লগইন
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-5 text-center bg-indigo-600 text-white font-black rounded-[25px] shadow-2xl shadow-indigo-200"
                    >
                       সদস্য হতে ক্লিক করুন
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

