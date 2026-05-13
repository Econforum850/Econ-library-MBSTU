import { 
  TrendingDown, TrendingUp, Wallet, 
  ArrowUpRight, ArrowDownLeft, Calendar,
  Download, Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Jan', amount: 4000, type: 'income' },
  { name: 'Feb', amount: -2400, type: 'expense' },
  { name: 'Mar', amount: 3000, type: 'income' },
  { name: 'Apr', amount: -1500, type: 'expense' },
  { name: 'May', amount: 5000, type: 'income' },
  { name: 'Jun', amount: -6460, type: 'expense' },
];

const transactions = [
  { id: 'TX-001', type: 'expense', category: 'বই ক্রয়', amount: '৳৫০০০', date: '১২ মে ২০২৪', status: 'Completed', note: 'গোর্কির মা ও অন্যান্য কতিপয় বই' },
  { id: 'TX-002', type: 'income', category: 'সদস্য চাঁদা', amount: '৳১২০০', date: '১০ মে ২০২৪', status: 'Completed', note: '১০ জন সদস্যের মাসিক চাঁদা' },
  { id: 'TX-003', type: 'expense', category: 'বিদ্যুৎ বিল', amount: '৳১৪৬০', date: '০৫ মে ২০২৪', status: 'Completed', note: 'এপ্রিল মাসের বিদ্যুৎ বিল' },
];

export default function AdminFinances() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">আয়-ব্যয় হিসেব (Finances)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সবশেষ হালনাগাদ: ১২ মে ২০২৪, ০৩:৪৫ মিনিট</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-3 px-6 py-4 bg-white border border-slate-200 rounded-[24px] font-black text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-5 h-5" />
            <span>রিপোর্ট ডাউনলোড</span>
          </button>
          <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span>নতুন এন্ট্রি</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">মোট আয়</span>
          </div>
          <p className="text-3xl font-black text-slate-900">৳১২,০০০</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-emerald-500">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            +১২% গত মাস থেকে
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">মোট ব্যয়</span>
          </div>
          <p className="text-3xl font-black text-slate-900">৳১৮,৪৬০</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-rose-500">
            <ArrowDownLeft className="w-3 h-3 mr-1" />
            +৪৫% গত মাস থেকে
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[40px] shadow-xl shadow-indigo-100 overflow-hidden relative group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-white/60 uppercase tracking-wider">বর্তমান স্থিতি</span>
          </div>
          <p className="text-3xl font-black">৳-৬,৪৬০</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-rose-200">
             অপর্যাপ্ত তহবিল
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">মাসিক সারাংশ</h3>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>জানুয়ারি - জুন ২০২৪</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '15px'}}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-8 px-4">সাম্প্রতিক লেনদেন</h3>
          <div className="space-y-4 flex-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-[32px] transition-all group">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                    tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.type === 'income' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{tx.category}</p>
                    <p className="text-[10px] font-bold text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-black", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount}
                  </p>
                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{tx.id}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-sm font-black text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">
            সব লেনদেন দেখুন
          </button>
        </div>
      </div>
    </div>
  );
}
