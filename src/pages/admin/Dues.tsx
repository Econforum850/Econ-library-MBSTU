import { useState, useEffect } from 'react';
import { 
  Wallet, Search, RefreshCw, 
  Loader2, CheckCircle2, AlertCircle,
  FileText, ArrowDownRight, User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseMember as SheetMember } from '@/src/lib/supabaseDatabase';

export default function AdminDues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const fetched = await db.getMembers();
      // Filter those who have dues
      setMembers(fetched.filter(m => {
        const dueVal = String(m.dues || '0').replace(/[^0-9]/g, '');
        return dueVal !== '0' && dueVal !== '';
      }));
    } catch (err) {
      console.error('Dues fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const totalDues = members.reduce((acc, m) => acc + (parseInt(String(m.dues).replace(/[^0-9]/g, '')) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্যদের বকেয়া (Dues)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সব সদস্যদের মাসিক ফি ও অন্যান্য বকেয়া তালিকা</p>
        </div>
        <div className="flex items-center space-x-3 bg-rose-50 p-3 rounded-[32px] border border-rose-100">
            <div className="px-8 py-4 bg-white rounded-[24px] shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 text-center">মোট বকেয়া পরিমাণ</span>
                <span className="text-3xl font-black text-rose-600">৳{totalDues}</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="relative w-full md:w-96 mx-auto">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">সদস্য (Member)</th>
                <th className="px-8 py-5">সদস্যপদ (Type)</th>
                <th className="px-8 py-5">বকেয়া পরিমাণ</th>
                <th className="px-8 py-5">শেষ পরিশোধ</th>
                <th className="px-8 py-5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{member.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{member.role}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-rose-600 font-black text-lg">{member.dues}</span>
                  </td>
                  <td className="px-8 py-6 text-slate-400 font-bold">{member.joinDate}</td>
                  <td className="px-8 py-6 text-right">
                    <button className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-slate-900 transition-all flex items-center space-x-2 ml-auto">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>সংগ্রহ করুন</span>
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && !loading && (
                  <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                          <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold">কারো কোন বকেয়া নেই! দুর্দান্ত কাজ।</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
