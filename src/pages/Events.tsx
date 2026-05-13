import { Calendar, Facebook, ShoppingCart, Search, Package } from 'lucide-react';
import { motion } from 'motion/react';

export default function Events() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">আসন্ন ইভেন্ট</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center"
      >
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Calendar className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">আপাতত নতুন কোনো ইভেন্ট নেই</h2>
        <p className="text-slate-500 mb-10">পরবর্তীতে আবার দেখুন অথবা আমাদের ফেসবুক পেজে চোখ রাখুন।</p>
        
        <a 
          href="#" 
          className="inline-flex items-center space-x-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <Facebook className="w-5 h-5" />
          <span>আমাদের ফেসবুক পেজ</span>
        </a>
      </motion.div>
    </div>
  );
}
