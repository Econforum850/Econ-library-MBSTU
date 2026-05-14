import { Calendar, Facebook, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function Events() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">ইভেন্ট আপডেট</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-100/50 p-10 md:p-16 text-center"
      >
        <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-10">
          <img 
            src="https://scontent.fdac181-1.fna.fbcdn.net/v/t39.30808-6/485961209_1189929272837388_4249405793488848808_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=kqGDwMhtSMAQ7kNvwG0EW8g&_nc_oc=AdpkGsr9P5RLxFJkKIZlmZD_DU2asXlikcl_M_b-vuYkMhQfs-XL53b3HGogNVQZdfw&_nc_zt=23&_nc_ht=scontent.fdac181-1.fna&_nc_gid=FHyHnNWjpWI4UOtifSG6xQ&_nc_ss=7b289&oh=00_Af5bxRxoZcONdLMmo_tt3JJhqLfo7DgZJzBoZ62cWSGb-A&oe=6A0C3C6E" 
            alt="Economics Department MBSTU" 
            className="w-full h-full object-cover rounded-full shadow-xl border-[6px] border-white"
          />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border-[4px] border-white shadow-sm">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-6">আপাতত নতুন কোনো ইভেন্ট নেই</h2>
        <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed max-w-xl mx-auto">
          আগামী ইভেন্টের আপডেট পেতে আমাদের অফিশিয়াল ওয়েবসাইট এবং ফেসবুক পেজে চোখ রাখুন।
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="https://eco.mbstu.ac.bd/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-indigo-50 text-indigo-700 rounded-[24px] font-black hover:bg-indigo-100 transition-all active:scale-95"
          >
            <Globe className="w-6 h-6" />
            <span>অফিশিয়াল ওয়েবসাইট</span>
          </a>
          
          <a 
            href="https://www.facebook.com/ecombstu/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Facebook className="w-6 h-6" />
            <span>ফেসবুক পেজ</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
