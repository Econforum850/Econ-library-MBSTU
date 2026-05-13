import { TrendingUp, TrendingDown, Wallet, Printer, FileSearch } from 'lucide-react';
import { motion } from 'motion/react';

export default function Account() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-slate-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">হিসাব-নিকাশ</h1>
        <div className="h-1 w-20 bg-indigo-600 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-start justify-between group"
        >
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-4 bg-emerald-50 w-fit px-3 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">মোট আয়</span>
            </div>
            <div className="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">৳ ০</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-start justify-between group"
        >
          <div>
            <div className="flex items-center space-x-2 text-rose-600 mb-4 bg-rose-50 w-fit px-3 py-1 rounded-full">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">মোট ব্যয়</span>
            </div>
            <div className="text-4xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">৳ ০</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-slate-900 p-8 rounded-[32px] shadow-2xl shadow-indigo-100 flex items-start justify-between group"
        >
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 mb-4 bg-indigo-500/10 w-fit px-3 py-1 rounded-full">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">বর্তমান ব্যালেন্স</span>
            </div>
            <div className="text-4xl font-black text-white">৳ ০</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Records */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">লেনদেনের রেকর্ড</h2>
            <div className="flex items-center space-x-3">
                 <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option>সব মাস</option>
                 </select>
                 <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট</span>
                 </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileSearch className="w-12 h-12 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium">কোনো লেনদেনের রেকর্ড পাওয়া যায়নি</p>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-gray-50 grid grid-cols-3 text-xs font-bold text-slate-400 uppercase tracking-widest px-12">
            <span>তারিখ</span>
            <span>বিবরণ</span>
            <span className="text-right">পরিমাণ</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-8 px-4">আয় বনাম ব্যয়</h2>
            <div className="h-64 border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center">
                <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">কোনো ডেটা নেই</p>
            </div>
        </div>
      </div>
    </div>
  );
}
