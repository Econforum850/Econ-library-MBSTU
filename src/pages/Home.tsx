import { motion } from 'motion/react';
import { Book, Calendar, ShoppingBag, ArrowRight, Users, Heart } from 'lucide-react';
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
    path: '/shop'
  }
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">একটি আধুনিক ডিজিটাল পাঠাগার</span>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          জ্ঞানের আলোয় <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">সমাজ গড়ি</span>
        </motion.h1>

        <motion.p 
          className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          আপনার পছন্দের বইটি এখন এক ক্লিকেই। লাইব্রেরির সদস্য হোন, ইভেন্টে অংশগ্রহণ করুন এবং নিজেকে বিকশিত করুন।
        </motion.p>

        <motion.div 
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/register" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <span>সদস্য হতে আবেদন করুন</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
            লগইন করুন
          </Link>
          <Link to="/books" className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            বই ব্রাউজ করুন
          </Link>
        </motion.div>

        <motion.div 
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
           <Link to="/shop" className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center space-x-2 border border-rose-100 hover:bg-rose-100 transition-all">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            <span>বই কিনুন</span>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * idx }}
              className="group p-10 bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all relative overflow-hidden"
            >
              <div className={cn("w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3", item.color)}>
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-6">{item.desc}</p>
              <Link to={item.path} className="text-indigo-600 font-bold flex items-center space-x-1 group-hover:translate-x-2 transition-transform capitalize">
                <span>View More</span>
                <ArrowRight className="w-4 h-4" />
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
