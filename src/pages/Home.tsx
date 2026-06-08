import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Users, BookOpen, Calendar, HelpCircle, GraduationCap, ChevronRight, Settings, X, Image,
  Plus, Trash2, Check, Sparkles, Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '@/src/lib/supabaseDatabase';
import { isAdminAuthenticated } from '@/src/lib/adminAuth';
import { cn } from '@/src/lib/utils';

const PRESET_BGS = [
  { name: 'ঐতিহ্যবাহী লাইব্রেরি (Default)', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600' },
  { name: 'আধুনিক রিডিং ডেস্ক', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1600' },
  { name: 'সেমিনার ও নোটিশ ইভেন্ট হল', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1600' },
  { name: 'বিভাগীয় ক্যাম্পাস প্রোগ্রাম', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1600' },
  { name: 'মেধা ও লেকচার থিয়েটার', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1600' },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600');
  const [showBgModal, setShowBgModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState<'BN' | 'EN'>('BN');
  
  // Real-time library statistics database state
  const [stats, setStats] = useState({
    booksCount: 1540,
    membersCount: 224,
    issuesCount: 52,
    eventsCount: 8
  });
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || recentBooks.length === 0) return;

    let intervalId: any;
    const startScroll = () => {
      intervalId = setInterval(() => {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll <= 0) return;

        // Card size is around 155-165px on mobile, gap is 16px
        const itemWidth = window.innerWidth < 768 ? 165 + 16 : 240;
        let nextScroll = scrollLeft + itemWidth;

        if (nextScroll >= maxScroll + 10) {
          nextScroll = 0;
        }

        el.scrollTo({
          left: nextScroll,
          behavior: 'smooth'
        });
      }, 3500);
    };

    startScroll();

    const pauseScroll = () => clearInterval(intervalId);
    const resumeScroll = () => {
      clearInterval(intervalId);
      startScroll();
    };

    el.addEventListener('mouseenter', pauseScroll);
    el.addEventListener('mouseleave', resumeScroll);
    el.addEventListener('touchstart', pauseScroll);
    el.addEventListener('touchend', resumeScroll);

    return () => {
      clearInterval(intervalId);
      el.removeEventListener('mouseenter', pauseScroll);
      el.removeEventListener('mouseleave', resumeScroll);
      el.removeEventListener('touchstart', pauseScroll);
      el.removeEventListener('touchend', resumeScroll);
    };
  }, [recentBooks]);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());
    
    const updateLang = () => {
      try {
        const stored = localStorage.getItem('preferred_lang') as 'BN' | 'EN';
        if (stored && (stored === 'BN' || stored === 'EN')) {
          setLang(stored);
        }
      } catch (_) {}
    };
    updateLang();
    
    window.addEventListener('storage', updateLang);
    const langInterval = setInterval(updateLang, 550);

    const fetchHeroBgAndStats = async () => {
      try {
        // Fetch graphics settings
        const config = await db.getGraphicsConfig();
        if (config) {
          if (config.homeHeroBg) {
            setBgImage(config.homeHeroBg);
          }
          if (config.backgroundGallery) {
            setGallery(config.backgroundGallery);
          }
        }
        
        // Fetch dynamic counts globally for accurate stats representation
        const books = await db.getBooks();
        const members = await db.getMembers();
        const issues = await db.getIssues();
        const events = await db.getEvents();
        
        setStats({
          booksCount: books.length > 0 ? books.length : 1240,
          membersCount: members.length > 0 ? members.length : 185,
          issuesCount: issues.length > 0 ? issues.filter(i => i.status === 'Active').length : 42,
          eventsCount: events.length > 0 ? events.length : 6
        });

        if (books && books.length > 0) {
          const processed = books.map(b => ({
            ...b,
            isEBook: b.category.toLowerCase().includes('e-book') || b.category.toLowerCase().includes('ই-বুক') || b.price === 'Free' || b.isEBook
          }));
          const sorted = [...processed].reverse().slice(0, 5); // display 5 latest additions
          setRecentBooks(sorted);
        }
      } catch (err) {
        console.error('Error loading homepage config or stats:', err);
      }
    };
    fetchHeroBgAndStats();

    return () => {
      window.removeEventListener('storage', updateLang);
      clearInterval(langInterval);
    };
  }, []);

  const handleAddImage = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (gallery.includes(trimmed)) {
      alert('এই ছবিটি ইতিমধ্যেই গ্যালারিতে আছে!');
      return;
    }
    const updated = [...gallery, trimmed];
    setGallery(updated);
    try {
      await db.saveGraphicsConfig({ backgroundGallery: updated });
    } catch (err) {
      console.error('Failed to save image to config:', err);
    }
    setCustomUrl('');
  };

  const handleDeleteImage = async (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি এই ছবিটি আপনার গ্যালারি থেকে চিরতরে মুছে ফেলতে চান?')) return;
    const updated = gallery.filter(url => url !== urlToDelete);
    setGallery(updated);
    try {
      await db.saveGraphicsConfig({ backgroundGallery: updated });
    } catch (err) {
      console.error('Failed to update config gallery:', err);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col pb-16 relative overflow-hidden">
      
      {/* Absolute high-tech vector light grids */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-purple/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-slate-300/10 blur-[120px] pointer-events-none z-0" />

      {/* 1. Large Hero Banner with Library Bookshelf Background */}
      <section className="relative w-full overflow-hidden min-h-[560px] md:min-h-[640px] flex items-center justify-center pt-8 pb-12 bg-brand-navy">
        {/* Bookshelf Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage} 
            alt="Library Bookshelf" 
            className="w-full h-full object-cover select-none pointer-events-none opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          {/* Rich modern navy/violet gradient system on top of default background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060b18]/50 via-brand-navy/90 to-[#060b18] z-10" />
        </div>

        {/* Dual Column Hero Content wrapper */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Title, Subtitle, and CTAs */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#121b3a]/50 backdrop-blur-md rounded-full border border-indigo-500/30 text-indigo-300 font-extrabold text-[10px] md:text-xs uppercase tracking-widest"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Department of Economics, MBSTU</span>
              </motion.div>

              {/* Bilingual Main Bold Heading */}
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-white text-4xl sm:text-5xl md:text-6xl font-sans tracking-tight font-black leading-[1.2] drop-shadow-md"
              >
                {lang === 'BN' ? (
                  <>হাজারো <span className="text-[#352df2] bg-gradient-to-r from-violet-400 to-[#05d5a1] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(139,92,246,0.35)]">বইয়ের</span> ডিজিটাল <br />সংগ্রহ</>
                ) : (
                  <>Digital Collection of <span className="text-[#352df2] bg-gradient-to-r from-violet-400 to-[#05d5a1] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(139,92,246,0.35)]">Thousands</span> <br />of Economics Books</>
                )}
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-slate-300 text-sm sm:text-base md:text-lg font-bold tracking-wide max-w-xl"
              >
                {lang === 'BN' ? 'আপনার পড়াশোনা হোক আরও সহজ ও আধুনিক' : 'Make your academic learning digital, seamless and highly efficient'}
              </motion.p>

              {/* Call to Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
              >
                <Link
                  to="/books"
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-[#352df2] hover:bg-[#2018da] text-white font-black text-xs rounded-2xl shadow-xl shadow-[#352df2]/20 hover:shadow-[#352df2]/40 transition-all active:scale-95 group"
                >
                  <BookOpen className="w-5 h-5 text-white" />
                  <span>{lang === 'BN' ? 'বই ব্রাউজ করুন' : 'Browse Digital Library'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>

                <Link
                  to="/register"
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-transparent hover:bg-white/5 border border-white/20 text-white font-extrabold text-xs rounded-2xl backdrop-blur-md transition-all active:scale-95 shadow-lg"
                >
                  <Users className="w-5 h-5 text-white/80" />
                  <span>{lang === 'BN' ? 'সদস্য হন' : 'Join as Member'}</span>
                </Link>
              </motion.div>

              {/* Slide indicators positioned cleanly inline */}
              <div className="flex items-center space-x-2.5 pt-6 justify-center lg:justify-start">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      activeSlide === idx ? 'w-8 bg-[#352df2]' : 'w-3 bg-slate-700'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

            </div>

            {/* Right Column: Custom interactive 3D stack of physical economics books with golden lit lamp */}
            <div className="lg:col-span-5 hidden lg:flex items-center justify-center relative min-h-[440px]">
              {/* Lamp light cone glow effect mimicking real retro-cyber desk light shadow */}
              <div className="absolute top-[8%] right-[25%] w-[330px] h-[370px] bg-gradient-to-b from-amber-400/10 via-amber-400/2 to-transparent clip-lamp-cone pointer-events-none z-10 blur-2xl" />

              {/* Desk Surface shadow mockup */}
              <div className="absolute bottom-[2%] w-80 h-4 bg-black/80 rounded-full blur-md" />

              {/* Stacked books pile (3D tilt on hover) */}
              <div className="relative w-72 flex flex-col items-center justify-end h-[340px] select-none z-20">
                {/* 5. MICROECONOMICS (Top Book) */}
                <motion.div 
                  whileHover={{ y: -8, rotate: -2, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 350 }}
                  className="w-[185px] h-9.5 bg-gradient-to-r from-emerald-600 via-[#123e2a] to-[#040812] rounded-[4px] border-b-2 border-slate-950 shadow-xl flex items-center justify-between px-3 text-white absolute bottom-[145px] rotate-[3.5deg] cursor-pointer"
                >
                  <div className="w-1.5 h-full bg-yellow-400" />
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#d1fae5]">MICROECONOMICS</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </motion.div>

                {/* 4. MACROECONOMICS */}
                <motion.div 
                  whileHover={{ y: -8, rotate: 1, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 350 }}
                  className="w-[200px] h-10 bg-gradient-to-r from-indigo-700 via-[#1a1435] to-[#040812] rounded-[4px] border-b-2 border-slate-950 shadow-xl flex items-center justify-between px-3 text-white absolute bottom-[110px] rotate-[-2.5deg] cursor-pointer"
                >
                  <div className="w-2 h-full bg-amber-400" />
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#e0e7ff]">MACROECONOMICS</span>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                </motion.div>

                {/* 3. DEVELOPMENT ECONOMICS */}
                <motion.div 
                  whileHover={{ y: -8, rotate: -1, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 350 }}
                  className="w-[210px] h-10.5 bg-gradient-to-r from-[#af5600] via-[#5c3c00] to-[#040812] rounded-[4px] border-b-2 border-slate-950 shadow-2xl flex items-center justify-between px-4 text-white absolute bottom-[72px] rotate-[1.8deg] cursor-pointer"
                >
                  <div className="w-1.5 h-full bg-emerald-400" />
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#fffbeb]">DEVELOPMENT ECONOMY</span>
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                </motion.div>

                {/* 2. PUBLIC FINANCE */}
                <motion.div 
                  whileHover={{ y: -8, rotate: 2, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 350 }}
                  className="w-[220px] h-11.5 bg-gradient-to-r from-rose-800 via-[#45181e] to-[#040812] rounded-[4px] border-b-2 border-slate-950 shadow-2xl flex items-center justify-between px-4 text-white absolute bottom-[33px] rotate-[-1.2deg] cursor-pointer"
                >
                  <div className="w-2 h-full bg-cyan-400" />
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#ffebeb]">PUBLIC FINANCE</span>
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                </motion.div>

                {/* 1. INTERNATIONAL ECONOMICS (Bottom Book Core Stack) */}
                <motion.div 
                  whileHover={{ y: -6, rotate: 0, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350 }}
                  className="w-[235px] h-12 bg-gradient-to-r from-teal-700 via-[#0e3b47] to-black rounded-[4px] border-b-2 border-slate-950 shadow-2xl flex items-center justify-between px-4 text-white absolute bottom-0 rotate-0 cursor-pointer"
                >
                  <div className="w-2.5 h-full bg-sky-400" />
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#e6fffa]">INTERNATIONAL ECON</span>
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                </motion.div>
              </div>

              {/* Realistic vector brass Desk Lamp structure layout */}
              <div className="absolute right-[5%] bottom-[12%] w-24 h-56 pointer-events-none select-none z-30 flex flex-col items-center justify-end">
                {/* Lamp Shade & Bulb */}
                <div className="absolute top-0 right-2 w-16 h-12 bg-gradient-to-br from-[#d97706] to-[#78350f] rounded-t-full shadow-lg border border-[#f59e0b]/30 origin-bottom rotate-[-23deg] flex items-end justify-center pb-1">
                  <div className="w-4 h-4 bg-amber-300 rounded-full shadow-[0_0_20px_rgba(253,224,71,1)] animate-pulse" />
                </div>
                {/* Curved Neck (Brass Color Line paths) */}
                <svg className="w-20 h-44 text-[#b45309] stroke-current stroke-[3] fill-none absolute top-8 right-6" viewBox="0 0 100 200">
                  <path d="M 80,180 Q 5,100 65,10" />
                </svg>
                {/* Heavy Base Block */}
                <div className="w-14 h-4 bg-gradient-to-r from-slate-700 to-slate-900 border-b border-slate-950 rounded-md shadow-md absolute bottom-0 right-14" />
              </div>

            </div>

          </div>
        </div>

        {/* Change Background Button */}
        {isAdmin && (
          <div className="absolute right-6 bottom-6 z-30">
            <button
              onClick={() => setShowBgModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-black/70 hover:bg-black/90 text-white/90 hover:text-white rounded-xl border border-white/10 backdrop-blur-md text-[11px] font-black transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>পটভূমি পরিবর্তন করুন</span>
            </button>
          </div>
        )}
      </section>

      {/* Dynamic Statistics Panel - Stunning glowing glass cards */}
      <section className="relative z-35 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-[32px] p-8 border border-slate-200/50 shadow-[0_12px_45px_rgba(0,0,0,0.03)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center select-none">
          
          <div className="space-y-1.5 p-4 rounded-2xl bg-[#352df2]/5 hover:bg-[#352df2]/10 border border-[#352df2]/10 transition-all">
            <span className="text-2xl sm:text-3xl font-black text-[#352df2] block tracking-tight font-mono">
              {stats.booksCount.toLocaleString()}+
            </span>
            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">
              {lang === 'BN' ? 'মোট বইয়ের সংগ্রহ' : 'Total Library Books'}
            </span>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 transition-all font-mono">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block tracking-tight font-mono">
              {stats.membersCount.toLocaleString()}+
            </span>
            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">
              {lang === 'BN' ? 'নিবন্ধিত সদস্য' : 'Active Members'}
            </span>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 transition-all font-mono">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block tracking-tight font-mono">
              {stats.issuesCount.toLocaleString()}+
            </span>
            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">
              {lang === 'BN' ? 'ধার দেওয়া বই' : 'Borrowed / Issued'}
            </span>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 transition-all font-mono">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block tracking-tight font-mono">
              {stats.eventsCount.toLocaleString()}
            </span>
            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">
              {lang === 'BN' ? 'সক্রিয় বিভাগীয় ইভেন্ট' : 'Academic Events'}
            </span>
          </div>

        </div>
      </section>

      {/* Recently Added Books Section with consistent beautiful light theme cards */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10 md:mt-14 relative z-10 select-none">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#352df2] bg-[#352df2]/5 px-3.5 py-1.5 rounded-full border border-[#352df2]/10 font-sans">
              {lang === 'BN' ? 'নতুন সংগ্রহ' : 'NEW ARRIVALS'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span>{lang === 'BN' ? 'লাইভ' : 'LIVE'}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {lang === 'BN' ? 'সদ্য যুক্তকৃত বইসমূহ' : 'Recently Added Books'}
          </h2>
          <div className="w-12 h-1 bg-[#352df2] rounded-full mt-3" />
        </div>

        {recentBooks.length > 0 ? (
          <div ref={scrollRef} className="flex overflow-x-auto whitespace-normal gap-4 pb-4 px-4 -mx-4 select-none no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-5 md:gap-4 md:px-1 md:-mx-0 md:pb-0">
            {recentBooks.map((book) => (
              <Link
                key={book.id}
                to={`/books?bookId=${book.id}`}
                className="group/card bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(53,45,242,0.12)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 p-1.5 flex flex-col cursor-pointer text-left shrink-0 w-[145px] xs:w-[165px] md:w-full md:shrink snap-center"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-100/80 rounded-lg mb-1.5 shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)]">
                  {/* Realistic Book 3D spine and bind highlighting */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10 rounded-l-lg pointer-events-none" />
                  <div className="absolute top-0 left-2 w-[1px] h-full bg-white/10 z-10 pointer-events-none" />

                  <img 
                    src={book.cover || 'https://placehold.co/400x600/eee/999?text=Cover+Not+Found'}        
                    alt={book.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1.5 z-20">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[6.5px] md:text-[7px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1",
                      book.isEBook 
                        ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/20" 
                        : "bg-teal-950/80 text-teal-300 border-teal-500/20"
                    )}>
                      <span className={cn("w-1 h-1 rounded-full", book.isEBook ? "bg-indigo-400" : "bg-teal-400")} />
                      {book.isEBook ? (lang === 'BN' ? 'ই-বুক' : 'E-Book') : (lang === 'BN' ? 'হার্ডকপি' : 'Library')}
                    </span>
                  </div>
                </div>
                <div className="px-1 pb-1 flex flex-col flex-1">
                  <h3 className="text-[10px] sm:text-[11px] font-black text-slate-800 group-hover/card:text-[#352df2] transition-colors mb-0.5 line-clamp-2 leading-tight min-h-[2.2rem]">{book.title}</h3>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 mb-1.5 font-bold truncate opacity-85">{book.author}</p>
                  <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 w-full">
                    <span className="text-[7.5px] font-mono font-black text-slate-400 uppercase tracking-wider truncate max-w-[65%]">
                      {book.category}
                    </span>
                    <span className="text-[8px] font-semibold text-[#352df2] flex items-center shrink-0">
                      {lang === 'BN' ? 'দেখুন' : 'View'} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200/50 max-w-4xl mx-auto shadow-sm">
            <span className="text-xs font-semibold text-slate-400">
              {lang === 'BN' ? 'কোনো বই পাওয়া যায়নি।' : 'No books found in the library catalog.'}
            </span>
          </div>
        )}
      </section>

      {/* Inject style tag to ensure scrollbar-free native-feeling scrolls on touch/desktop swipe */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 2. Section "আমাদের বৈশিষ্ট্য" with Gen-Z High-contrast borders */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-14 relative z-10 overflow-hidden">
        <div className="text-center mb-8 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {lang === 'BN' ? 'আমাদের বৈশিষ্ট্য' : 'Our Digital Features'}
          </h2>
          <div className="w-12 h-1 bg-[#352df2] rounded-full mt-3" />
        </div>

        {/* Responsive layout: Slide scroll on mobile, nice clear grid on desktop */}
        <div className="flex overflow-x-auto whitespace-normal gap-6 pb-6 px-4 -mx-4 select-none no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-8 lg:gap-10 max-w-5xl md:mx-auto md:px-0 md:pb-0 md:mx-auto md:w-full">
          
          {/* Card 1: ডিজিটাল ক্যাটালগ */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="relative overflow-hidden bg-white border border-slate-200/60 rounded-[32px] p-8 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between group h-full hover:border-[#352df2]/30 transition-all duration-300 shrink-0 w-[85vw] xs:w-[350px] sm:w-[420px] md:w-full md:shrink snap-center"
          >
            {/* Outline icon backdrop */}
            <div className="absolute right-6 top-8 opacity-[0.02] text-[#352df2] pointer-events-none select-none z-0">
              <BookOpen className="w-36 h-36" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-[#352df2]/5 border border-[#352df2]/10 text-[#352df2] rounded-2xl flex items-center justify-center shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>

              <div className="space-y-3 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'BN' ? 'ডিজিটাল ক্যাটালগ' : 'Digital Book Catalog'}
                </h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  {lang === 'BN' 
                    ? 'হাজারো বইয়ের সংগ্রহ অনলাইনে দেখে নিন এবং আপনার পছন্দের বইটি খুঁজুন।' 
                    : 'Search through thousands of digital books cataloged by topic online and pick your course assets.'}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 text-left">
              <Link 
                to="/books"
                className="inline-flex items-center space-x-2 px-5 py-3 bg-[#352df2] hover:bg-[#2018da] text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                <span>{lang === 'BN' ? 'বিস্তারিত দেখুন' : 'Explore Books'}</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: ইভেন্ট ও প্রতিযোগিতা */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="relative overflow-hidden bg-white border border-slate-200/60 rounded-[32px] p-8 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between group h-full hover:border-emerald-500/30 transition-all duration-300 shrink-0 w-[85vw] xs:w-[350px] sm:w-[420px] md:w-full md:shrink snap-center"
          >
            {/* Outline icon backdrop */}
            <div className="absolute right-6 top-8 opacity-[0.02] text-emerald-450 pointer-events-none select-none z-0">
              <Calendar className="w-36 h-36" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Calendar className="w-7 h-7" />
              </div>

              <div className="space-y-3 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'BN' ? 'ইভেন্ট ও প্রতিযোগিতা' : 'Events & Notices'}
                </h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  {lang === 'BN' 
                    ? 'বৃত্তি পরীক্ষা এবং সাংস্কৃতিক প্রতিযোগিতায় অংশ নিন যা আপনার দক্ষতা বাড়াবে।' 
                    : 'Participate in department study contests, seminars, book reviews and notice programmes.'}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 text-left">
              <Link 
                to="/events"
                className="inline-flex items-center space-x-2 px-5 py-3 bg-[#352df2] hover:bg-[#2018da] text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                <span>{lang === 'BN' ? 'বিস্তারিত দেখুন' : 'View Notices'}</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Custom Dual Column CTA Banner representing user's loaded Banner 1 */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-14 relative z-10">
        <div className="bg-gradient-to-br from-[#060b18] via-[#0b1428] to-[#040812] border border-[#352df2]/20 rounded-[36px] p-8 sm:p-12 text-left shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Glowing spotlights decorations inside CTA panel */}
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

          {/* Left Column: Customized 3D book heap + mortarboard model layout matching Banner 1 exactly */}
          <div className="md:col-span-4 hidden md:flex items-center justify-center relative min-h-[220px]">
            {/* Ambient Violet spot */}
            <div className="absolute w-[180px] h-[180px] rounded-full bg-violet-650/20 blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col items-center justify-center pt-8 pr-4">
              {/* Mortar board cap model resting on top */}
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute z-20 top-[-6px] left-1/2 -translate-x-1/2 w-28 flex flex-col items-center pointer-events-none select-none"
              >
                {/* Diamond Cap */}
                <div className="w-24 h-6 bg-gradient-to-br from-slate-800 to-slate-950 shadow-md border-b border-slate-700/60 rounded-b-sm rotate-[-4deg] relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full absolute top-[2px] right-3 shadow-lg" />
                  {/* Tassel link */}
                  <div className="w-1 h-12 bg-gradient-to-b from-[#f59e0b] to-yellow-600 absolute right-3 top-[5px] rounded-full flex items-end justify-center">
                    <div className="w-2 h-4 bg-[#b45309] rounded-b-sm" />
                  </div>
                </div>
                {/* Cap Base under-ring */}
                <div className="w-14 h-5.5 bg-gradient-to-r from-slate-900 to-black border border-slate-800 rounded-full -mt-2 shadow-inner" />
              </motion.div>

              {/* Compact Pile of Purple Books (Vector elements of user attachment 1) */}
              <div className="w-36 flex flex-col items-center justify-end h-[135px] relative z-10">
                {/* Book 3 (Top Purple) */}
                <div className="w-24 h-6/5 bg-gradient-to-r from-violet-600 via-indigo-900 to-slate-950 rounded-[2px] border-b border-slate-900 absolute bottom-[48px] shadow-md flex items-center justify-between px-2 text-white/9w">
                  <span className="text-[6px] font-bold tracking-widest text-violet-300">ECO</span>
                  <div className="w-1.5 h-1.5 bg-[#a78bfa] rounded-full" />
                </div>
                {/* Book 2 (Middle Purple) */}
                <div className="w-[110px] h-7 bg-gradient-to-r from-indigo-700 via-violet-900 to-[#020015] rounded-[2px] border-b border-slate-900 absolute bottom-[24px] shadow-lg flex items-center justify-between px-2 text-white/9w">
                  <span className="text-[6px] font-bold tracking-widest text-violet-300 font-mono">MBSTU</span>
                  <div className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                </div>
                {/* Book 1 (Bottom Purple) */}
                <div className="w-[124px] h-8 bg-gradient-to-r from-indigo-800 via-[#100330] to-black rounded-[2px] border-b border-slate-950 absolute bottom-0 shadow-xl flex items-center justify-between px-3 text-white/9w">
                  <span className="text-[6px] font-mono font-bold tracking-widest text-violet-300">ECONOMICS</span>
                  <div className="w-1 h-1.5 bg-violet-400 rounded-full" />
                </div>
              </div>

              {/* Simple aesthetic botanical pot leaf and shadow */}
              <div className="absolute right-[-4px] bottom-1 w-7 h-10 bg-gradient-to-b from-emerald-500 to-teal-800 rounded-t-full shadow-lg border border-emerald-400/20 blur-[0.4px] pointer-events-none select-none" />
              <div className="w-28 h-2 bg-black/60 rounded-full blur-[2px] absolute bottom-[-4px]" />
            </div>
          </div>

          {/* Right Column: CTA Texts and Actionable triggers */}
          <div className="col-span-1 md:col-span-8 space-y-6 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {lang === 'BN' ? 'আমাদের অগ্রযাত্রার অংশ হতে চান?' : 'Want to be part of our study circle?'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-300/80 font-bold leading-relaxed max-w-xl">
              {lang === 'BN' 
                ? 'সদস্য আবেদন থেকে শুরু করে যেকোনো প্রয়োজনে আমাদের সাথেই থাকুন। জ্ঞানের আলো সবার মাঝে ছড়িয়ে দেই।' 
                : 'Join from students membership requests or support the local department library initiatives. We are always glad to assist you.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/register"
                className="px-8 py-4 bg-white hover:bg-slate-100 text-[#060b18] font-black text-xs rounded-2xl text-center transition-all shadow-md active:scale-95"
              >
                {lang === 'BN' ? 'সদস্য হতে আবেদন করুন' : 'Apply for Student Account'}
              </Link>
              <Link
                to="/donors"
                className="px-8 py-4 bg-[#352df2] hover:bg-[#2018da] border border-[#352df2]/40 text-white font-extrabold text-xs rounded-2xl text-center transition-all shadow-sm active:scale-95"
              >
                {lang === 'BN' ? 'দাতা সদস্যদের তালিকা' : 'View Library Donors'}
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Background Change Modal */}
      <AnimatePresence>
        {showBgModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBgModal(false)}
              className="absolute inset-0 bg-slate-910/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl border border-slate-100 z-10 font-sans overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-5 h-5 text-[#05d5a1]" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">অ্যাডমিন ফটো ও পটভূমি গ্যালারি</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-505 text-left mt-1.5">
                    স্বাগত এডমিন! আপনি এখানে হাজার হাজার কাস্টম ফটো লিঙ্ক হিসেবে সংরক্ষণ করে যখন ইচ্ছা হোমপেজের ব্যাকগ্রাউন্ড পরিবর্তন করতে পারেন।
                  </p>
                </div>
                <button 
                  onClick={() => setShowBgModal(false)}
                  className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-all cursor-pointer shadow-sm bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Dual Column */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 overflow-y-auto flex-1 text-left">
                
                {/* Column 1: Add image & preview (4 cols) */}
                <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Upload className="w-3.5 h-3.5 text-indigo-505" />
                      <span>নতুন ছবি লিঙ্ক যুক্ত করুন</span>
                    </h4>

                    {/* Custom URL Input */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">ইমেজ বা ফটো URL (Direct URL Link):</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/your-image.jpg"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Real-time Preview Area */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">ইমেজ লাইভ প্রিভিউ:</span>
                      <div className="aspect-[16/10] bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 relative flex items-center justify-center p-2.5">
                        {customUrl.trim() ? (
                          <img 
                            src={customUrl.trim()} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-xl shadow-sm"
                            onError={(e) => {
                              // If image loading fails
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-extrabold text-slate-400">সঠিক ইমেজ URL দিলে এখানে ছবি দেখা যাবে।</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for local storage / cloud db */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!customUrl.trim()}
                      onClick={() => handleAddImage(customUrl)}
                      className="w-full py-4.5 bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/20 text-indigo-700 font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Plus className="w-4 h-4" />
                      <span>গ্যালারি অ্যালবামে যুক্ত করুন</span>
                    </button>
                    <button
                      type="button"
                      disabled={!customUrl.trim()}
                      onClick={async () => {
                        const url = customUrl.trim();
                        if (url) {
                          setBgImage(url);
                          try {
                            const updated = gallery.includes(url) ? gallery : [...gallery, url];
                            setGallery(updated);
                            await db.saveGraphicsConfig({ 
                              homeHeroBg: url,
                              backgroundGallery: updated
                            });
                            setShowBgModal(false);
                            setCustomUrl('');
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="w-full py-4.5 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      সরাসরি প্রধান পটভূমি পরিবর্তন করুন
                    </button>
                  </div>
                </div>

                {/* Column 2: Gallery Explorer Grid (7 cols) */}
                <div className="md:col-span-1 border-r border-slate-100 hidden md:block" />
                
                <div className="md:col-span-6 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      আপনার গ্যালারি সংগ্রহ ({PRESET_BGS.length + gallery.length} টি ইমেজ)
                    </h4>
                    {gallery.length > 0 && (
                      <button 
                        onClick={() => {
                          if (window.confirm('নিশ্চিত? সবগুলো কাস্টম ছবি মুছে ফেলা হবে।')) {
                            setGallery([]);
                            db.saveGraphicsConfig({ backgroundGallery: [] });
                          }
                        }}
                        className="text-[10px] font-black text-rose-550 hover:text-rose-700 uppercase"
                      >
                        সব মুছুন
                      </button>
                    )}
                  </div>

                  {/* Scrollable Album Storage */}
                  <div className="flex-1 overflow-y-auto max-h-[420px] pr-2 space-y-5">
                    
                    {/* Presets (Fixed standard assets) */}
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-2 font-mono">সিস্টেম থিম ইমেজ সমূহ (Presets)</span>
                      <div className="grid grid-cols-2 gap-3">
                        {PRESET_BGS.map((preset) => {
                          const isActive = bgImage === preset.url;
                          return (
                            <div 
                              key={preset.url}
                              onClick={async () => {
                                setBgImage(preset.url);
                                await db.saveGraphicsConfig({ homeHeroBg: preset.url });
                              }}
                              className={`group relative aspect-[14/9] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shadow-sm ${
                                isActive 
                                  ? 'border-emerald-500 ring-4 ring-emerald-50' 
                                  : 'border-slate-150 hover:border-slate-300'
                              }`}
                            >
                              <img src={preset.url} className="w-full h-full object-cover select-none" alt="" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-3 py-1 bg-white text-slate-900 text-[9px] font-black rounded-lg shadow-sm">পটভূমি সেট করুন</span>
                              </div>
                              {/* Item label */}
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 text-center backdrop-blur-xs">
                                <p className="text-[8px] font-black text-white truncate">{preset.name}</p>
                              </div>
                              {isActive && (
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Saved Custom Images (Durable logic storage) */}
                    <div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block mb-2 font-mono">অ্যাডমিন সংরক্ষিত ফটো অ্যালবাম (Custom Gallery)</span>
                      {gallery.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-150 rounded-2xl text-center bg-slate-50/20">
                          <Image className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400">কোন কাস্টম ইমেজ এখনো যুক্ত করা হয়নি।</p>
                          <p className="text-[9px] font-semibold text-slate-400/80 mt-1">বামদিকের ফর্মটি ব্যবহার করে ইমেজ লিঙ্ক যুক্ত করুন।</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {gallery.map((url, i) => {
                            const isActive = bgImage === url;
                            return (
                              <div 
                                key={url + '-' + i}
                                onClick={async () => {
                                  setBgImage(url);
                                  await db.saveGraphicsConfig({ homeHeroBg: url });
                                }}
                                className={`group relative aspect-[14/9] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shadow-sm ${
                                  isActive 
                                    ? 'border-emerald-500 ring-4 ring-emerald-50' 
                                    : 'border-slate-150 hover:border-slate-300'
                                }`}
                              >
                                <img src={url} className="w-full h-full object-cover select-none" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <span className="px-2.5 py-1 bg-white text-slate-900 text-[9px] font-black rounded-lg shadow-sm">সেট করুন</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteImage(url, e)}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {isActive && (
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
