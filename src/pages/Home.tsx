import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Users, BookOpen, Calendar, HelpCircle, GraduationCap, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-16">
      
      {/* 1. Large Hero Banner with Library Bookshelf Background */}
      <section className="relative w-full overflow-hidden h-[540px] md:h-[620px] flex items-center justify-center">
        {/* Bookshelf Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600" 
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

    </div>
  );
}
