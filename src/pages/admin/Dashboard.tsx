import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BookOpen, Clock, Wallet, 
  Plus, ShoppingCart, MessageSquare, 
  ArrowRight, Activity, TrendingUp,
  Loader2, CheckCircle2, Heart, FileText, Bell, Check, X,
  Coins, AlertTriangle
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

  // Global Metrics details
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [pendingMembersCount, setPendingMembersCount] = useState<number>(0);
  const [totalDues, setTotalDues] = useState<number>(0);
  const [activeIssues, setActiveIssues] = useState<number>(0);

  interface AppNotification {
    id: string;
    type: 'member' | 'issue';
    title: string;
    description: string;
    timestamp: string;
    isNew: boolean;
  }

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  const markAsSeen = (id: string, type: 'member' | 'issue') => {
    localStorage.setItem(`seen_${type}_${id}`, 'true');
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (toastNotification?.id === id) {
      setToastNotification(null);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const books = await db.getBooks();
        setBookCount(books.length);

        const members = await db.getMembers();
        setTotalMembers(members.length);
        const acceptedCount = members.filter(m => String(m.status || '').toLowerCase() === 'accepted' || String(m.status || '').toLowerCase() === 'active').length;
        setMemberCount(acceptedCount);
        const pendingCount = members.filter(m => String(m.status || '').toLowerCase() === 'pending').length;
        setPendingMembersCount(pendingCount);

        const duesSum = members.reduce((sum, m) => sum + (m.dues || 0), 0);
        setTotalDues(duesSum);

        const issues = await db.getIssues();
        const activeIssuesCount = issues.filter(i => i.status === 'Active').length;
        setIssueCount(activeIssuesCount);
        setActiveIssues(activeIssuesCount);

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

  // Real-time activity checking effect (polls membership/issues tables)
  useEffect(() => {
    const checkNewActivity = async () => {
      try {
        const membersList = await db.getMembers();
        const issuesList = await db.getIssues();

        const pendingMembers = membersList.filter(m => m.status === 'pending');
        const activeIssues = issuesList.filter(i => i.status === 'Active');

        const newAlerts: AppNotification[] = [];

        pendingMembers.forEach((member) => {
          const key = `seen_member_${member.id}`;
          if (!localStorage.getItem(key)) {
            newAlerts.push({
              id: member.id,
              type: 'member',
              title: 'নতুন রেজিস্ট্রেশন অনুরোধ! 👤',
              description: `${member.name} (${member.phone || 'ফোন নেই'}) সদস্যপদের জন্য আবেদন করেছেন।`,
              timestamp: member.joinDate || 'আজ',
              isNew: true
            });
          }
        });

        activeIssues.forEach((issue) => {
          const key = `seen_issue_${issue.id}`;
          if (!localStorage.getItem(key)) {
            newAlerts.push({
              id: issue.id,
              type: 'issue',
              title: 'বই ইস্যু ও ধার অনুরোধ! 📚',
              description: `সদস্য ${issue.memberName} "${issue.bookTitle}" বইটি নেওয়ার অনুরোধ করেছেন।`,
              timestamp: issue.issueDate || 'আজ',
              isNew: true
            });
          }
        });

        if (newAlerts.length > 0) {
          setNotifications(prev => {
            const ids = new Set(newAlerts.map(n => n.id));
            const filteredPrev = prev.filter(p => !ids.has(p.id));
            return [...newAlerts, ...filteredPrev];
          });

          // Show the latest as a toast alert!
          const latestItem = newAlerts[0];
          setToastNotification(latestItem);

          // Audio notification (pure synth beep)
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(880, context.currentTime); 
            gain.gain.setValueAtTime(0.04, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.12);
          } catch (soundErr) {
            // Safe fallback when audio is blocked
          }
        }
      } catch (err) {
        console.error('Notification lookup error:', err);
      }
    };

    checkNewActivity();
    const interval = setInterval(checkNewActivity, 10000); 
    return () => clearInterval(interval);
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
      {/* Real-time Toast Alert popup */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-indigo-500 rounded-3xl p-5 shadow-2xl flex items-start gap-4 text-white print:hidden"
          >
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl animate-pulse shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-indigo-300">{toastNotification.title}</h4>
              <p className="text-xs text-slate-300 font-bold leading-normal mt-1">{toastNotification.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => markAsSeen(toastNotification.id, toastNotification.type)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-all"
                >
                  দেখেছি (Dismiss)
                </button>
              </div>
            </div>
            <button 
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
            <button 
              onClick={() => window.print()}
              className="flex items-center space-x-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-[28px] font-black shadow-xl transition-all active:scale-95 text-white"
            >
              <FileText className="w-5 h-5" />
              <span>রিপোর্ট প্রিন্ট করুন</span>
            </button>
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

      {/* Global Metrics Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-slate-900 text-white rounded-[40px] p-8 md:p-10 shadow-xl relative overflow-hidden border border-slate-800"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <span className="w-2.5 h-6 bg-indigo-500 rounded-full inline-block animate-pulse"></span>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase">সার্বিক পরিসংখ্যান (Global Metrics)</h3>
              <p className="text-[10px] font-black text-[#a5b4fc] tracking-wider uppercase mt-1">Unified Multi-source Library Ledger Summary</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Member counts card */}
            <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">সদস্য বিবরণী</span>
                  <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{totalMembers}</span>
                    <span className="text-xs text-slate-400 font-bold">নিবন্ধিত (Total Members)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${totalMembers > 0 ? (memberCount / totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold text-slate-400">
                <div>
                  <span className="block text-emerald-450 text-emerald-400 font-black text-sm">{memberCount} জন</span>
                  অনুমোদিত (Accepted)
                </div>
                <div>
                  <span className="block text-amber-450 text-amber-400 font-black text-sm">{pendingMembersCount} জন</span>
                  পেন্ডিং (Pending)
                </div>
              </div>
            </div>

            {/* Total dues card */}
            <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-rose-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fca5a5]">আর্থিক বকেয়া</span>
                  <Coins className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-rose-400">৳{totalDues.toLocaleString('bn-BD')}</span>
                    <span className="text-xs text-slate-400 font-bold">মোট বকেয়া (Total Dues)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal">
                    সদস্যদের হিসাব বিবরণী ও বই ক্রয়ের লাইব্রেরি ড্যাশবোর্ড থেকে সংগৃহীত বকেয়া ঋণ।
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-rose-400 font-semibold">তাৎক্ষণিক বকেয়া চেক</span>
                <Link to="/admin/users" className="text-[#a5b4fc] hover:text-white flex items-center gap-1 group/btn">
                  হিসাব বহি <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Outstanding issues card */}
            <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">বই ইস্যু ও ট্র্যাকিং</span>
                  <AlertTriangle className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-400">{activeIssues} টি</span>
                    <span className="text-xs text-slate-400 font-bold">সচল ইস্যু (Outstanding)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal">
                    বর্তমানে পাঠকদের দেয়া এবং এখনও ফেরত না হওয়া সক্রিয় বইয়ের মোট পরিমাণ।
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-amber-400 font-semibold">ধার ট্র্যাকিং সক্রিয়</span>
                <Link to="/admin/issues" className="text-[#a5b4fc] hover:text-white flex items-center gap-1 group/btn">
                  কার্যাবলী <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

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
          
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[300px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">রিয়েল-টাইম কার্যক্রম ও নোটিফিকেশন ⚡</h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                {notifications.length} টি সচল নোটিফিকেশন
              </span>
            </div>
            
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3 animate-pulse" />
                  <p className="text-slate-700 font-bold text-sm">সব কিছু আপ-টু-ডেট আছে!</p>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
                    কোনো নতুন রেজিস্ট্রেশন অনুরোধ বা পেন্ডিং বই ধার নেওয়ার রিকোয়েস্ট নেই।
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all flex items-start gap-4 text-left"
                    >
                      <div className={cn(
                        "p-3 rounded-2xl shrink-0 text-white shadow-sm",
                        notif.type === 'member' ? "bg-indigo-500" : "bg-purple-500"
                      )}>
                        {notif.type === 'member' ? <Users className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 leading-tight">{notif.title}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold font-mono whitespace-nowrap">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mt-1 leading-normal">{notif.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Link 
                            to={notif.type === 'member' ? "/admin/users" : "/admin/issues"} 
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-xl transition-all shadow-sm"
                          >
                            রিভিউ করুন
                          </Link>
                          <button
                            type="button"
                            onClick={() => markAsSeen(notif.id, notif.type)}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[9px] font-black rounded-xl transition-all"
                          >
                            বাতিল করুন
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
