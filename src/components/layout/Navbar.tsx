import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, Globe, LogIn, Menu, X, BookOpen, ShieldCheck, 
  Home, Calendar, Users, Heart, UserPlus, ShieldAlert 
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
 
      {/* 2. Mobile Responsive Top Header Bar */}
      <header className="lg:hidden w-full bg-brand-navy text-white h-20 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-brand-royal/20 select-none">
        {/* Brand Group */}
        <Link to="/" className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-brand-royal/20 bg-[#1d294d]/40">
            <img src={logoGold} alt="Econ Library Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-white leading-tight font-sans">
              {lang === 'BN' ? 'ইকোলাইব্রেরি' : 'EconLibrary'}
            </span>
            <span className="text-[8px] text-brand-steel font-extrabold tracking-widest uppercase">
              ECONOMICS MBSTU
            </span>
          </div>
        </Link>
 
        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl text-brand-steel hover:text-white hover:bg-[#1d294d]/60 bg-brand-navy border border-brand-royal/20 transition-all active:scale-95"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>
 
      {/* 3. Mobile Navigation Drawer Slide Down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-20 left-0 w-full bg-brand-navy text-[#ede4d3]/80 border-b border-brand-royal/20 overflow-hidden shadow-2xl z-40"
          >
            <div className="px-6 py-8 space-y-5">
              
              {/* Menu items list */}
              <div className="space-y-1.5">
                {links.map((link) => {
                  const IconComp = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3.5 px-6 py-4 rounded-xl text-sm font-black transition-all",
                        isActive 
                          ? "bg-brand-royal text-white shadow-lg" 
                          : "text-brand-steel hover:bg-brand-royal/15"
                      )}
                    >
                      <IconComp className="w-4 h-4 text-brand-steel" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
 
              {/* Lang switcher & Admin button inline */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-royal/20">
                <button 
                  onClick={() => {
                    toggleLang();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 py-4 bg-[#1d294d]/40 border border-brand-royal/25 text-brand-cream rounded-xl font-black text-xs cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-brand-steel" />
                  <span>{lang === 'BN' ? 'ইংরেজি' : 'বাংলা'} ({lang === 'BN' ? 'EN' : 'BN'})</span>
                </button>
                
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 py-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl font-black text-xs text-center"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 py-4 bg-[#1d294d]/40 border border-brand-royal/25 text-brand-steel rounded-xl font-bold text-xs text-center"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-steel/65" />
                    <span>অ্যাডমিন পোর্টাল</span>
                  </Link>
                )}
              </div>
 
              {/* User login / Account Profile block */}
              <div className="pt-2">
                {user ? (
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md"
                  >
                    <span>{lang === 'BN' ? 'আমার প্রোফাইল' : 'Profile'} ({user.name})</span>
                  </Link>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-4 text-center bg-[#1d294d]/40 hover:bg-[#1d294d]/70 border border-brand-royal/25 text-brand-cream font-extrabold text-xs rounded-xl"
                    >
                      {lang === 'BN' ? 'লগইন করুন' : 'Login'}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-4.5 text-center bg-brand-royal text-white font-black text-xs rounded-xl shadow-lg"
                    >
                      {lang === 'BN' ? 'সদস্য হতে আবেদন করুন' : 'Apply for Membership'}
                    </Link>
                  </div>
                )}
              </div>
 
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
