import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, Globe, LogIn, Menu, X, BookOpen, ShieldCheck, 
  Home, Calendar, Users, Heart, UserPlus, ShieldAlert, User 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { isAdminAuthenticated } from '@/src/lib/adminAuth';
import logoGold from '@/src/assets/images/logo_gold.png';

const navLinksBN = [
  { name: 'হোম', path: '/', icon: Home },
  { name: 'বইসমূহ', path: '/books', icon: BookOpen },
  { name: 'ইভেন্ট', path: '/events', icon: Calendar },
  { name: 'দাতা সদস্য', path: '/donors', icon: Heart },
];

const navLinksEN = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Books', path: '/books', icon: BookOpen },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Donors', path: '/donors', icon: Heart },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'BN' | 'EN'>(() => {
    try {
      return (localStorage.getItem('preferred_lang') as 'BN' | 'EN') || 'BN';
    } catch (_) {
      return 'BN';
    }
  });
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

  const toggleLang = () => {
    const nextLang = lang === 'BN' ? 'EN' : 'BN';
    setLang(nextLang);
    try {
      localStorage.setItem('preferred_lang', nextLang);
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
  };

  const links = lang === 'BN' ? navLinksBN : navLinksEN;

  return (
    <>
      {/* 1. Desktop Vertical Sidebar Navigation (Matches user screenshot exactly) */}
      <aside className="hidden lg:flex w-72 bg-[#060b18] text-white h-screen sticky top-0 flex-col justify-between p-6 z-50 border-r border-[#425585]/10 overflow-y-auto select-none">
        
        {/* Brand Group */}
        <div className="space-y-10">
          <Link to="/" className="flex items-center space-x-3.5 group px-2 pt-2">
            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shadow-xl shadow-black/40 group-hover:scale-110 group-hover:rotate-[12deg] transition-all duration-500 overflow-hidden border border-brand-royal/20 bg-brand-navy/40">
              <img src={logoGold} alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white leading-tight font-sans tracking-tight Beng-font">
                {lang === 'BN' ? 'ইকোলাইব্রেরি' : 'EconLibrary'}
              </span>
              <span className="text-[9px] text-[#ede4d3]/60 font-extrabold tracking-[0.18em] uppercase">
                ECONOMICS MBSTU
              </span>
            </div>
          </Link>
 
          {/* Nav List */}
          <nav className="space-y-2">
            {links.map((link) => {
              const IconComp = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center space-x-3.5 px-5 py-4 rounded-xl text-sm font-black transition-all duration-300 relative group truncate",
                    isActive 
                      ? "bg-[#352df2] text-white shadow-lg shadow-[#352df2]/25 border border-[#352df2]/30" 
                      : "text-brand-steel hover:text-white hover:bg-white/5"
                  )}
                >
                  <IconComp className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-brand-steel group-hover:text-brand-cream")} />
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute right-0 top-1/3 bottom-1/3 w-1 bg-white rounded-l-full"
                    />
                  )}
                </Link>
              );
            })}
 
            {/* Admin Portal shortcut if not logged in but want to enter panels */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-3.5 px-5 py-4 rounded-xl text-sm font-black text-emerald-400 hover:bg-emerald-500/5 transition-all mt-6"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'BN' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Area'}</span>
              </Link>
            )}
          </nav>
        </div>
 
        {/* Bottom Panel (Language context switcher & Join buttons & Credits) */}
        <div className="space-y-6 pt-6 border-t border-[#425585]/10">
          
          {/* Language Switcher - Matches the minimalist elegant capsule in screenshot */}
          <div className="px-2">
            <button 
              onClick={toggleLang}
              className="flex items-center space-x-2.5 px-4 py-2 border border-[#425585]/35 rounded-xl bg-[#121b3a]/40 hover:bg-[#121b3a]/80 text-[#ede4d3] text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Globe className="w-4 h-4 text-[#352df2]" />
              <span className="font-mono font-black">{lang}</span>
              <ChevronDown className="w-3 h-3 text-brand-steel" />
            </button>
          </div>
 
          {/* User Auth Info Join list */}
          <div className="px-2">
            {user ? (
              <Link 
                to="/account" 
                className="w-full py-4.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] font-black rounded-xl hover:shadow-xl hover:shadow-emerald-950/20 transition-all active:scale-95 flex items-center justify-center space-x-2 border border-emerald-500/30"
              >
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-[9px] font-black">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <span>{lang === 'BN' ? 'আমার প্রোফাইল' : 'My Profile'}</span>
              </Link>
            ) : (
              <div className="space-y-2.5">
                <Link 
                  to="/register"
                  className="w-full py-4 bg-[#352df2] hover:bg-[#2018da] text-white text-[11px] font-black rounded-xl shadow-lg shadow-[#352df2]/15 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-[#352df2]/30"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'BN' ? 'সদস্য হন' : 'Join Membership'}</span>
                </Link>
                <div className="flex items-center justify-gap-2 justify-center text-xs text-brand-steel mt-1">
                  <Link to="/login" className="text-brand-cream hover:text-white font-extrabold text-[10px] uppercase tracking-wider">
                    {lang === 'BN' ? 'লগইন' : 'Login'}
                  </Link>
                  <span className="text-[#ede4d3]/20 font-bold mx-2">|</span>
                  <Link to="/admin/login" className="text-brand-steel hover:text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1">
                    <span>{lang === 'BN' ? 'অ্যাডমিন' : 'Admin'}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
 
          {/* Copyright Meta */}
          <div className="px-2 text-left">
            <p className="text-[9px] text-[#ede4d3]/40 font-extrabold tracking-wide leading-relaxed">
              © 2026 Econ-library-MBSTU<br />
              {lang === 'BN' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All Rights Reserved.'}
            </p>
          </div>
 
        </div>
      </aside>
 
      {/* 2. Mobile Responsive Top Header Bar (Native App Style) */}
      <header className="lg:hidden w-full bg-[#060b18] text-white h-16 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-[#425585]/10 select-none">
        {/* Brand Group */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-brand-royal/20 bg-[#1d294d]/40">
            <img src={logoGold} alt="Econ Library Logo" className="w-7 h-7 object-contain animate-none" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white leading-tight font-sans tracking-tight">
              {lang === 'BN' ? 'ইকোলাইব্রেরি' : 'EconLibrary'}
            </span>
            <span className="text-[7.5px] text-brand-steel font-extrabold tracking-widest uppercase mt-0.5">
              ECONOMICS MBSTU
            </span>
          </div>
        </Link>
 
        {/* Mobile Inline Actions */}
        <div className="flex items-center space-x-2">
          {/* Admin shortlink indicator */}
          {isAdmin && (
            <Link 
              to="/admin"
              className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black flex items-center justify-center transition-all duration-300 animate-none"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Quick Language Toggle Button */}
          <button 
            onClick={toggleLang}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#425585]/35 rounded-xl bg-[#121b3a]/40 hover:bg-[#121b3a]/80 text-[#ede4d3] text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#352df2]" />
            <span className="font-mono font-black">{lang}</span>
          </button>
        </div>
      </header>
 
      {/* 3. Mobile Fixed Bottom App Navigation Bar (Premium Material Design Frame) */}
      <nav className="lg:hidden fixed bottom-5 left-5 right-5 h-16 bg-[#080d22]/95 backdrop-blur-xl border border-white/10 rounded-[22px] flex items-center justify-around px-2 z-50 shadow-[0_10px_35px_rgba(0,0,0,0.55)] select-none transition-all duration-300">
        {[
          {
            name: lang === 'BN' ? 'হোম' : 'Home',
            path: '/',
            icon: Home
          },
          {
            name: lang === 'BN' ? 'বইসমূহ' : 'Books',
            path: '/books',
            icon: BookOpen
          },
          {
            name: lang === 'BN' ? 'ইভেন্ট' : 'Events',
            path: '/events',
            icon: Calendar
          },
          {
            name: user ? (lang === 'BN' ? 'প্রোফাইল' : 'Profile') : (lang === 'BN' ? 'সদস্য' : 'Member'),
            path: '/account',
            icon: User
          }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = location.pathname === tab.path || 
                           (tab.path !== '/' && location.pathname.startsWith(tab.path));
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 py-1 relative group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl transition-all duration-350 flex items-center justify-center relative",
                isActive ? "text-white scale-105 animate-none" : "text-slate-400 group-hover:text-slate-200"
              )}>
                <TabIcon className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "text-slate-400 group-hover:text-slate-300 group-hover:scale-105")} />
                
                {isActive && (
                  <>
                    <motion.div
                      layoutId="bottomTabIndicator"
                      className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                    <span className="absolute -top-0.5 w-[5px] h-[5px] bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
                  </>
                )}
              </div>
              <span className={cn(
                "text-[9px] mt-0.5 font-sans transition-all text-center leading-none tracking-tight",
                isActive ? "text-[#ede4d3] font-black" : "text-slate-500 font-bold"
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
