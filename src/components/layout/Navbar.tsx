import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Globe, LogIn, Menu, X, ShoppingCart, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useCart } from '../../lib/cart';

const navLinksBN = [
  { name: 'হোম', path: '/' },
  { name: 'বইসমূহ', path: '/books' },
  { name: 'ইভেন্ট', path: '/events' },
  { name: 'বই কিনুন', path: '/shop' },
  { name: 'দাতা সদস্য', path: '/donors' },
];

const navLinksEN = [
  { name: 'Home', path: '/' },
  { name: 'Books', path: '/books' },
  { name: 'Events', path: '/events' },
  { name: 'Shop', path: '/shop' },
  { name: 'Donors', path: '/donors' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'BN' | 'EN'>('BN');
  const location = useLocation();
  const { totalItems } = useCart();

  const links = lang === 'BN' ? navLinksBN : navLinksEN;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-all">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 leading-tight">Econ-library-MBSTU</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Economics Dept. Library</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  location.pathname === link.path 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="relative group px-4 py-2 cursor-pointer flex items-center text-sm font-bold text-slate-600 hover:text-slate-900">
               {lang === 'BN' ? 'আরো' : 'More'} <ChevronDown className="ml-1 w-4 h-4" />
            </div>

            <div className="h-6 w-[1px] bg-gray-200 mx-4" />

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Link to="/cart" className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </Link>

              <button 
                onClick={() => setLang(lang === 'BN' ? 'EN' : 'BN')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all hover:border-indigo-200"
              >
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>{lang}</span>
              </button>
              
              <Link 
                to="/account" 
                className="px-5 py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
              >
                {lang === 'BN' ? 'আয়-ব্যয় হিসেব' : 'Accounts'}
              </Link>

              <Link 
                to="/admin/login" 
                className="px-5 py-2.5 bg-indigo-50 text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95 border border-indigo-100"
              >
                {lang === 'BN' ? 'অ্যাডমিন লগইন' : 'Admin Login'}
              </Link>

              <Link 
                to="/admin" 
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
              >
                {lang === 'BN' ? 'অ্যাডমিন' : 'Admin'}
              </Link>
              
              <Link 
                to="/login"
                className="px-4 py-2 text-slate-600 text-sm font-bold hover:text-slate-900"
              >
                {lang === 'BN' ? 'লগইন' : 'Login'}
              </Link>
              
              <Link 
                to="/register"
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 border-b-4 border-indigo-800"
              >
                Join Now
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
             <Link 
                to="/account" 
                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-lg shadow-md"
              >
                হিসোব
              </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-gray-100 bg-slate-50 border border-slate-100"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-6 py-4 rounded-2xl text-base font-bold transition-all",
                    location.pathname === link.path 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                <button 
                  onClick={() => {
                    setLang(lang === 'BN' ? 'EN' : 'BN');
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 px-6 py-4 text-slate-700 w-full font-bold"
                >
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <span>Language: {lang}</span>
                </button>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-6 py-4 text-slate-700 font-bold"
                >
                  <LogIn className="w-5 h-5 text-indigo-500" />
                  <span>লগইন</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-5 text-center bg-indigo-600 text-white font-black rounded-[30px] shadow-2xl shadow-indigo-200"
                >
                   Join Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

