import { useState, useEffect } from 'react';
import { 
  Wallet, Search, RefreshCw, 
  Loader2, CheckCircle2, AlertCircle,
  FileText, ArrowDownRight, User, X, CheckSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseMember as SheetMember } from '@/src/lib/supabaseDatabase';

export default function AdminDues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Collect modal states
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SheetMember | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [isSavingCollection, setIsSavingCollection] = useState(false);

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

  const openCollectModal = (member: SheetMember) => {
    setSelectedMember(member);
    const numericDue = parseInt(String(member.dues).replace(/[^0-9]/g, '')) || 0;
    setCollectAmount(String(numericDue));
    setIsCollectModalOpen(true);
  };

  const handleCollectDuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const amountToDeduct = parseInt(collectAmount) || 0;
    const currentDue = parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 0;

    if (amountToDeduct <= 0) {
      alert('সঠিক ধণাত্মক টাকার অঙ্ক প্রবেশ করুন!');
      return;
    }

    try {
      setIsSavingCollection(true);
      const updatedDue = Math.max(0, currentDue - amountToDeduct);
      
      const updatedMember = {
        ...selectedMember,
        dues: updatedDue
      };

      // 1. Update member state in DB
      await db.saveMember(updatedMember);

      // 2. Add an income transaction trace to Finances module!
      await db.saveTransaction({
        type: 'income',
        category: 'বকেয়া সংগ্রহ (ফি)',
        amount: amountToDeduct,
        date: new Date().toLocaleDateString('bn-BD'),
        status: 'Completed',
        note: `${selectedMember.name} (ID: ${selectedMember.id}) এর বকেয়া পরিশোধ`
      });

      alert(`৳${amountToDeduct} সফলভাবে সংগ্রহ করা হয়েছে এবং হিসাব-নিকাশ মডিউলে জমা হয়েছে!`);
      setIsCollectModalOpen(false);
      setSelectedMember(null);
      await loadMembers();
    } catch (err) {
      console.error('Collect dues error:', err);
      alert('বকেয়া সংগ্রহ সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSavingCollection(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDues = members.reduce((acc, m) => acc + (parseInt(String(m.dues).replace(/[^0-9]/g, '')) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
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
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all"
                />
            </div>
            <button 
              onClick={loadMembers}
              disabled={loading}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
        </div>

        {loading && members.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">সদস্য (Member)</th>
                  <th className="px-8 py-5">সদস্যপদ (Type)</th>
                  <th className="px-8 py-5">বকেয়া পরিমাণ</th>
                  <th className="px-8 py-5">যোগদানের তারিখ</th>
                  <th className="px-8 py-5 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredMembers.map((member) => (
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
                      <span className="text-rose-600 font-black text-lg">৳ {member.dues}</span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-bold">{member.joinDate}</td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => openCollectModal(member)}
                        className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-slate-900 transition-all flex items-center space-x-2 ml-auto"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        <span>সংগ্রহ করুন</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
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
        )}
      </div>

      {/* Collect Dues Modal */}
      {isCollectModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">বকেয়া ফি সংগ্রহ করুন</h3>
              <button 
                onClick={() => setIsCollectModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectDuesSubmit} className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2xl space-y-2.5">
                <p className="text-xs font-bold text-slate-500">বকেয়া দাতার নাম: <strong className="text-slate-900 font-black">{selectedMember.name}</strong></p>
                <p className="text-xs font-bold text-slate-500">মেম্বার আইডি: <strong className="text-slate-900 font-mono font-black">{selectedMember.id}</strong></p>
                <p className="text-xs font-bold text-slate-500">বর্তমান মোট বকেয়া: <strong className="text-rose-600 font-black">৳{selectedMember.dues}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">সংগৃহীত টাকার পরিমাণ (৳)</label>
                <input 
                  type="number"
                  required
                  min={1}
                  max={parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 99999}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-2.5 text-[10px] font-bold text-slate-400 leading-relaxed">
                <CheckSquare className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>বকেয়া সংগ্রহ করার পর সদস্যের অ্যাকাউন্ট ব্যালেন্সটি কমে যাবে এবং সংগৃহীত পরিমাণ অর্থ হিসাব-নিকাশ (Finances) লেজারে মেম্বার ফি বাবদ আয় হিসেবে নথিভুক্ত হবে।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl"
                  disabled={isSavingCollection}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-rose-600 text-white font-black rounded-xl shadow-lg shadow-rose-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  disabled={isSavingCollection}
                >
                  {isSavingCollection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>অর্থ সংগ্রহ নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
