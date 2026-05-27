import { motion } from 'motion/react';
import { 
  Users, BookOpen, Clock, Wallet, 
  Plus, ShoppingCart, MessageSquare, 
  ArrowRight, Activity, TrendingUp,
  Loader2, CheckCircle2, Heart
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/src/lib/supabaseDatabase';

const data = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Feb', income: 3000, expense: 1398 },
  { name: 'Mar', income: 2000, expense: 9800 },
  { name: 'Apr', income: 2780, expense: 3908 },
  { name: 'May', income: 1890, expense: 4800 },
  { name: 'Jun', income: 2390, expense: 3800 },
];

export default function AdminDashboard() {
  const [bookCount, setBookCount] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [issueCount, setIssueCount] = useState<number>(0);
  const [donorCount, setDonorCount] = useState<number>(0);
  const [shopCount, setShopCount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const books = await db.getBooks();
        setBookCount(books.length);

        const members = await db.getMembers();
        const acceptedCount = members.filter(m => String(m.status || '').toLowerCase() === 'accepted').length;
        setMemberCount(acceptedCount);

        const issues = await db.getIssues();
        setIssueCount(issues.filter(i => i.status === 'Active').length);

        const donors = await db.getDonors();
        setDonorCount(donors.length);

        // Filter books categorized in shop or keep a dynamic shopCount
        const shopBooks = books.filter(b => b.price && b.price !== '৳০');
        setShopCount(shopBooks.length);

        const txs = await db.getTransactions();
        const inc = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const exp = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        setBalance(inc - exp);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const stats = [
    { label: 'সক্রিয় সদস্য', value: memberCount.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', change: 'Accepted' },
    { label: 'ক্যাটালগে বই', value: bookCount.toString(), icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', change: 'Live Data' },
    { label: 'সক্রিয় ইস্যু', value: issueCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: 'Live Data' },
    { label: 'দাতা সদস্য', value: donorCount.toString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', change: 'Live Data' },
    { label: 'শপ আইটেম', value: shopCount.toString(), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50', change: 'Live Data' },
    { label: 'ফান্ড ব্যালেন্স', value: `৳${balance.toLocaleString('bn-BD')}`, icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50', change: 'Update Soon' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Banner */}
      <div className="relative overflow-hidden bg-[#1e293b] rounded-[40px] p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
              <Activity className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">হালনাগাদ ও পরিচালনা</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              আপনার দৈনন্দিন পাঠাগারের কার্যক্রম পরিচালনা করুন। সদস্যপদ ব্যবস্থাপনা এবং বই ইস্যু/রিটার্ন করুন।
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/admin/users" className="flex items-center space-x-3 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[28px] font-bold backdrop-blur-md transition-all active:scale-95">
              <Users className="w-5 h-5" />
              <span>সদস্যগণ</span>
            </Link>
            <button className="flex items-center space-x-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 rounded-[28px] font-black shadow-xl shadow-indigo-600/30 transition-all active:scale-95 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>বই প্রদান</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[36px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actions */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-4">দ্রুত পদক্ষেপ</h3>
            <div className="grid grid-cols-1 gap-4">
              <button className="flex items-center justify-between p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-3xl transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-700">নতুন বই যোগ করুন</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
              <button className="flex items-center justify-between p-6 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-3xl transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-700">বই ক্রয়ের অনুরোধ</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
              </button>
            </div>
            
            <button className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <MessageSquare className="w-5 h-5" />
              <span>মেসেঞ্জার খুলুন</span>
            </button>
          </div>
        </div>

        {/* Recent Activity / Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">লেনদেনের সংক্ষিপ্তসার</h3>
                <p className="text-sm text-slate-500 font-bold mb-4">আয় বনাম ব্যয় বিশ্লেষণ</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-black text-slate-900 border border-slate-100">মাসিক</button>
                <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">বাৎসরিক</button>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '20px'}}
                    itemStyle={{fontWeight: 900}}
                  />
                  <Area type="monotone" dataKey="income" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[300px] flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-black text-slate-900 mb-4 px-8 py-2 bg-slate-50 rounded-full">সাম্প্রতিক কার্যকলাপ</h3>
            <div className="text-slate-400 font-bold max-w-sm mt-4">
              রিয়েলটাইম আপডেট বন্ধ আছে (কোটা সংরক্ষণের জন্য)। ড্যাশবোর্ড রিফ্রেশ করুন।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
