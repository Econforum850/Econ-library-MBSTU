import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Users, BookOpen, Calendar, HelpCircle, GraduationCap, ChevronRight, Settings, X, Image,
  Plus, Trash2, Check, Sparkles, Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '@/src/lib/supabaseDatabase';
import { isAdminAuthenticated } from '@/src/lib/adminAuth';

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

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());
    const fetchHeroBg = async () => {
      try {
        const config = await db.getGraphicsConfig();
        if (config) {
          if (config.homeHeroBg) {
            setBgImage(config.homeHeroBg);
          }
          if (config.backgroundGallery) {
            setGallery(config.backgroundGallery);
          }
        }
      } catch (err) {
        console.error('Error loading homepage config:', err);
      }
    };
    fetchHeroBg();
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-16">
      
      {/* 1. Large Hero Banner with Library Bookshelf Background */}
      <section className="relative w-full overflow-hidden h-[540px] md:h-[620px] flex items-center justify-center">
        {/* Bookshelf Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage} 
            alt="Library Bookshelf" 
            className="w-full h-full object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Rich gradients to fade and shadow the hero */}
          <div className="absolute inset-0 bg-slate-950/75 blend-multiply z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-slate-500/30 text-slate-200 font-extrabold text-[10px] md:text-xs uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Department of Economics, MBSTU</span>
          </motion.div>

          {/* Bengali Main Bold Heading */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white text-4xl sm:text-5xl md:text-7xl font-sans tracking-tight font-black leading-[1.25] max-w-4xl drop-shadow-lg"
          >
            হাজারো <span className="text-[#05d5a1] drop-shadow-[0_2px_15px_rgba(5,213,161,0.35)]">বইয়ের</span> ডিজিটাল <br />
            সংগ্রহ
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-300 text-sm sm:text-base md:text-lg font-bold tracking-wide mt-6 max-w-xl"
          >
            আপনার পড়াশোনা হোক আরও সহজ ও আধুনিক
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto"
          >
            <Link
              to="/books"
              className="flex items-center justify-center space-x-2 px-8 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/2 transition-all active:scale-95 group"
            >
              <BookOpen className="w-5 h-5 text-indigo-200" />
              <span>বই ব্রাউজ করুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="flex items-center justify-center space-x-2 px-8 py-4.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm rounded-2xl backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              <Users className="w-5 h-5 text-slate-300" />
              <span>সদস্য হন</span>
            </Link>
          </motion.div>

          {/* Dots carousels indicators */}
          <div className="flex items-center space-x-2.5 mt-16 md:mt-20">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-10 bg-white' : 'w-4 bg-white/30'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

        {/* Change Background Button */}
        {isAdmin && (
          <div className="absolute right-6 bottom-6 z-30">
            <button
              onClick={() => setShowBgModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-black/60 hover:bg-black/85 text-white/95 hover:text-white rounded-xl border border-white/20 backdrop-blur-md text-[11px] font-black transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              <span>পটভূমি পরিবর্তন করুন</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. Section "আমাদের বৈশিষ্ট্য" */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-14 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3.5xl font-black text-[#1e293b] tracking-tight font-sans">हमारे वैशिष्ट्य / আমাদের বৈশিষ্ট্য</h2>
          <div className="w-12 h-1 bg-indigo-600 rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: ডিজিটাল ক্যাটালগ */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="relative overflow-hidden bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-lg shadow-slate-100/40 flex flex-col justify-between group h-full"
          >
            {/* Outline icon backdrop */}
            <div className="absolute right-6 top-8 opacity-[0.03] text-indigo-900 pointer-events-none select-none z-0">
              <BookOpen className="w-36 h-36" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">ডিজিটাল ক্যাটালগ</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  হাজারো বইয়ের সংগ্রহ অনলাইনে দেখে নিন এবং আপনার পছন্দের বইটি খুঁজুন।
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <Link 
                to="/books"
                className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-50 border border-slate-100 group-hover:border-indigo-150 group-hover:bg-indigo-50/50 text-indigo-600 font-extrabold text-xs rounded-xl transition-all"
              >
                <span>বিস্তারিত দেখুন</span>
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: ইভেন্ট ও প্রতিযোগিতা */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="relative overflow-hidden bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-lg shadow-slate-100/40 flex flex-col justify-between group h-full"
          >
            {/* Outline icon backdrop */}
            <div className="absolute right-6 top-8 opacity-[0.03] text-emerald-900 pointer-events-none select-none z-0">
              <Calendar className="w-36 h-36" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Calendar className="w-7 h-7" />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">ইভেন্ট ও প্রতিযোগিতা</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  বৃত্তি পরীক্ষা এবং সাংস্কৃতিক প্রতিযোগিতায় অংশ নিন যা আপনার দক্ষতা বাড়াবে।
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <Link 
                to="/events"
                className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-50 border border-slate-100 group-hover:border-emerald-150 group-hover:bg-emerald-50/50 text-emerald-600 font-extrabold text-xs rounded-xl transition-all"
              >
                <span>বিস্তারিত দেখুন</span>
                <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Deep Midnight Blue CTA Banner */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-[#0b1630] border border-indigo-950/20 rounded-[36px] p-8 sm:p-14 text-center flex flex-col items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
          {/* Subtle light orb decoration inside CTA card */}
          <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              আমাদের অগ্রযাত্রার অংশ হতে চান?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 font-bold leading-relaxed max-w-xl mx-auto">
              সদস্য আবেদন থেকে শুরু করে যেকোনো প্রয়োজনে আমাদের সাথেই থাকুন। জ্ঞানের আলো সবার মাঝে ছড়িয়ে দেই।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
            <Link
              to="/register"
              className="px-8 py-4 bg-white hover:bg-indigo-50 text-slate-900 font-extrabold text-xs rounded-2xl text-center transition-all shadow-md active:scale-95"
            >
              সদস্য হতে আবেদন করুন
            </Link>
            <Link
              to="/donors"
              className="px-8 py-4 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-800/80 text-white font-extrabold text-xs rounded-2xl text-center transition-all shadow-sm active:scale-95"
            >
              দাতা সদস্যদের তালিকা
            </Link>
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
