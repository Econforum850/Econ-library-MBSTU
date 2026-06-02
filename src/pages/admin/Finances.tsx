import { 
  TrendingDown, TrendingUp, Wallet, 
  ArrowUpRight, ArrowDownLeft, Calendar,
  Download, Plus, Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useState, useEffect } from 'react';
import { db, SupabaseTransaction as SheetTransaction, SupabaseMember, parseAnyDate } from '@/src/lib/supabaseDatabase';

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#f43f5e', '#64748b'];

export default function AdminFinances() {
  const [transactions, setTransactions] = useState<SheetTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; count: number }[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    const loadFinances = async () => {
      try {
        setLoading(true);
        // Fetch transactions
        const fetchedTx = await db.getTransactions();
        setTransactions(fetchedTx);
        
        const inc = fetchedTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const exp = fetchedTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        setSummary({ income: inc, expense: exp, balance: inc - exp });

        // Fetch members and process dues grouped by year of joining
        const fetchedMembers = await db.getMembers();
        setMembers(fetchedMembers);

        const yearDuesMap: { [yearStr: string]: { dues: number; count: number } } = {};
        let totalDuesSum = 0;

        fetchedMembers.forEach(m => {
          const duesVal = m.dues || 0;
          if (duesVal > 0) {
            totalDuesSum += duesVal;

            let joinYear = 'Unknown / N/A';
            const baseDateStr = m.validationStartDate || (m.joinDate ? m.joinDate.split('|')[0] : '');
            if (baseDateStr) {
              const dObj = parseAnyDate(baseDateStr);
              if (dObj) {
                joinYear = 'যোগদান: ' + dObj.getFullYear();
              } else if (baseDateStr.includes('-')) {
                const yr = baseDateStr.split('-')[0];
                if (yr && yr.length === 4) joinYear = 'যোগদান: ' + yr;
              } else if (baseDateStr.includes('/')) {
                const parts = baseDateStr.split('/');
                const yr = parts[2]?.trim().split(' ')[0];
                if (yr && yr.length === 4) joinYear = 'যোগদান: ' + yr;
              }
            }
            
            if (!yearDuesMap[joinYear]) {
              yearDuesMap[joinYear] = { dues: 0, count: 0 };
            }
            yearDuesMap[joinYear].dues += duesVal;
            yearDuesMap[joinYear].count += 1;
          }
        });

        const formattedPieData = Object.keys(yearDuesMap).map(key => ({
          name: key,
          value: yearDuesMap[key].dues,
          count: yearDuesMap[key].count
        })).sort((a, b) => b.value - a.value);

        setPieData(formattedPieData);
        setTotalOutstanding(totalDuesSum);

      } catch (err) {
        console.error('Finances fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFinances();
  }, []);

  // Format data for chart (grouped by month)
  // For now, just taking the last few transactions for display if we don't want to group yet
  const chartData = transactions.slice(0, 6).map(t => ({
    name: t.date,
    amount: t.type === 'income' ? t.amount : -t.amount
  }));

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">আয়-ব্যয় হিসেব (Finances)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সবশেষ হালনাগাদ: {new Date().toLocaleDateString('bn-BD')}</p>
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
          <p className="text-3xl font-black text-slate-900">৳{summary.income.toLocaleString('bn-BD')}</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-emerald-500">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            লাইভ আপডেট
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
          <p className="text-3xl font-black text-slate-900">৳{summary.expense.toLocaleString('bn-BD')}</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-rose-500">
            <ArrowDownLeft className="w-3 h-3 mr-1" />
            লাইভ আপডেট
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-[40px] shadow-xl overflow-hidden relative group text-white",
          summary.balance >= 0 ? "bg-indigo-600 shadow-indigo-100" : "bg-rose-600 shadow-rose-100"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-white/60 uppercase tracking-wider">বর্তমান স্থিতি</span>
          </div>
          <p className="text-3xl font-black">৳{summary.balance.toLocaleString('bn-BD')}</p>
          <div className="mt-4 flex items-center text-[10px] font-black text-white/80">
             {summary.balance >= 0 ? "তহবিল পর্যাপ্ত" : "অপর্যাপ্ত তহবিল"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">লেনদেনের সংক্ষিপ্তসার</h3>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>রিয়েলটাইম চার্ট</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{name: 'No Data', amount: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '15px'}}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outstanding Dues Pie Chart */}
        <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-900">শ্রেণীভিত্তিক বকেয়া ফি</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black px-2.5 py-1 rounded-md">ব্যাচ/বছর</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-6 font-sans">মেম্বারদের সেশন ও ভ্যালিডেশন শুরুর বছর অনুযায়ী বকেয়া টাকার পরিমাণ</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <div className="w-full h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`৳${value}`, 'বকেয়া']}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '10px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in Pie Chart */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 px-1 py-0.5 rounded">মোট বকেয়া</span>
                  <span className="block text-lg font-black text-slate-800">৳{totalOutstanding}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm font-bold">কোন বকেয়া ফি নেই!</p>
                <p className="text-[10px] mt-1">সব সদস্যের বাৎসরিক ফি পরিশোধিত রয়েছে</p>
              </div>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 max-h-[140px] overflow-y-auto no-scrollbar font-sans">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                    />
                    <span className="font-bold text-slate-650 truncate max-w-[130px]">{item.name}</span>
                  </div>
                  <div className="text-right font-black text-slate-800">
                    ৳{item.value} <span className="text-[9px] text-slate-400 font-bold">({item.count} জন)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-8 px-4">সাম্প্রতিক লেনদেন</h3>
          <div className="space-y-4 flex-1">
            {transactions.slice(0, 5).map((tx) => (
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
                    {tx.type === 'income' ? '+' : '-'}৳{tx.amount}
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
