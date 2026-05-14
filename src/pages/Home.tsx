import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Calendar, ShoppingBag, ArrowRight, Users, Heart, MapPin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

const features = [
  {
    title: 'ডিজিটাল ক্যাটালগ',
    desc: 'হাজারো বইয়ের সংগ্রহ অনলাইনে দেখে নিন এবং আপনার পছন্দের বইটি খুঁজুন।',
    icon: Book,
    color: 'bg-indigo-50 text-indigo-600',
    path: '/books'
  },
  {
    title: 'ইভেন্ট ও প্রতিযোগিতা',
    desc: 'বৃত্তি পরীক্ষা এবং সাংস্কৃতিক প্রতিযোগিতায় অংশ নিন যা আপনার দক্ষতা বাড়াবে।',
    icon: Calendar,
    color: 'bg-emerald-50 text-emerald-600',
    path: '/events'
  },
  {
    title: 'অনলাইন বুক শপ',
    desc: 'সাশ্রয়ী মূল্যে পছন্দের বইগুলো অর্ডার করুন সরাসরি আপনার ঠিকানায়।',
    icon: ShoppingBag,
    color: 'bg-rose-50 text-rose-600',
    path: '/books'
  }
];

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000',
    title: 'জ্ঞানের আলোয় সমাজ গড়ি',
    subtitle: 'ইকোনমিক্স বিভাগ ডিজিটাল লাইব্রেরি',
    accent: 'from-indigo-600 to-blue-500'
  },
  {
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2000',
    title: 'হাজারো বইয়ের ডিজিটাল সংগ্রহ',
    subtitle: 'আপনার পড়াশোনা হোক আরও সহজ ও আধুনিক',
    accent: 'from-emerald-600 to-teal-500'
  },
  {
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=2000',
    title: 'ইকোনমিক্স বিভাগ পাঠাগার',
    subtitle: 'মেধাবী শিক্ষার্থীদের জ্ঞানের তীর্থস্থান',
    accent: 'from-amber-500 to-orange-400'
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section with Slider */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-slate-900/60 z-10" />
              <img 
                src={slides[currentSlide].image} 
                alt="Library Background" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 px-4 max-w-7xl mx-auto text-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Department of Economics, MBSTU</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-8xl font-black text-white leading-tight mb-8 tracking-tighter">
                {slides[currentSlide].title.split(' ').map((word, i) => (
                  <span key={i} className={i === 1 ? `text-transparent bg-clip-text bg-gradient-to-r ${slides[currentSlide].accent}` : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <p className="text-slate-200 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
                {slides[currentSlide].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/books" className="group px-12 py-6 bg-indigo-600 text-white rounded-[20px] font-black flex items-center justify-center space-x-4 shadow-2xl shadow-indigo-500/20 hover:bg-white hover:text-slate-900 transition-all active:scale-95">
              <ShoppingBag className="w-6 h-6" />
              <span>বই ব্রাউজ করুন</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/register" className="px-12 py-6 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[20px] font-black hover:bg-white hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center space-x-4">
              <Users className="w-6 h-6" />
              <span>সদস্য হন</span>
            </Link>
          </motion.div>
        </div>

        {/* Slider Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
           {slides.map((_, idx) => (
             <button
               key={idx}
               onClick={() => setCurrentSlide(idx)}
               className={cn(
                 "w-12 h-1.5 rounded-full transition-all duration-500",
                 currentSlide === idx ? "bg-white" : "bg-white/20 hover:bg-white/40"
               )}
             />
           ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-32 max-w-7xl mx-auto bg-white">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl font-black text-slate-900">আমাদের বিশেষত্ব</h2>
          <div className="w-12 h-1.5 bg-indigo-600 mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {features.slice(0, 2).map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * idx }}
              className="group p-12 bg-white rounded-[50px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform">
                <item.icon className="w-40 h-40" />
              </div>
              <div className={cn("w-20 h-20 rounded-[25px] mb-10 flex items-center justify-center transition-all group-hover:rotate-6", item.color)}>
                <item.icon className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-6">{item.title}</h3>
              <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">{item.desc}</p>
              <Link to={item.path} className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-50 text-indigo-600 rounded-2xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <span>বিস্তারিত দেখুন</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="px-4 py-24 max-w-5xl mx-auto">
        <motion.div 
          className="bg-slate-900 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-200"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />

          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
            আমাদের অগ্রযাত্রার <br />
            <span className="text-indigo-300">অংশ হতে চান?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
            সদস্য আবেদন থেকে শুরু করে যেকোনো প্রয়োজনে আমাদের সাথেই থাকুন। জ্ঞানের আলো সবার মাঝে ছড়িয়ে দেই।
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link to="/register" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-lg active:scale-95">
              সদস্য হতে আবেদন করুন
            </Link>
            <Link to="/donors" className="px-8 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>দাতা সদস্যদের তালিকা</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
