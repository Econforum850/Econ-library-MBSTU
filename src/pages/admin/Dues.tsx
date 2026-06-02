import { useState, useEffect } from 'react';
import { 
  Wallet, Search, RefreshCw, 
  Loader2, CheckCircle2, AlertCircle,
  FileText, ArrowDownRight, User, X, CheckSquare, Plus, Printer, Calendar
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseMember as SheetMember, calculateYearlyFeesOwedOnly, parseAnyDate, getMonthsBetween } from '@/src/lib/supabaseDatabase';

export default function AdminDues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMembers, setAllMembers] = useState<SheetMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'with-dues'>('with-dues');

  // Collect dues modal states
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SheetMember | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDate, setCollectDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Add/Charge custom due modal states
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeMember, setChargeMember] = useState<SheetMember | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [chargeReason, setChargeReason] = useState('বাৎসরিক বিলম্ব ফি/অন্যান্য');
  const [isSavingCharge, setIsSavingCharge] = useState(false);

  // Print Report modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const formatDateToSlash = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const fetched = await db.getMembers();
      // Only keep accepted or active members for dues ledger
      const validMembers = fetched.filter(m => m.status === 'accepted' || m.status === 'active');
      setAllMembers(validMembers);
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
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setCollectDate(`${yyyy}-${mm}-${dd}`);
    setIsCollectModalOpen(true);
  };

  const openChargeModal = (member: SheetMember) => {
    setChargeMember(member);
    setChargeAmount('50');
    setChargeReason('বাৎসরিক মেম্বারশিপ বকেয়া ফি');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setChargeDate(`${yyyy}-${mm}-${dd}`);
    setIsChargeModalOpen(true);
  };

  const handleCollectDuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const amountToDeduct = parseInt(collectAmount) || 0;
    const currentDue = parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 0;

    if (amountToDeduct <= 0) {
      alert('সদস্যের বকেয়া পরিশোধের জন্য সঠিক টাকার পরিমাণ দিন!');
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

      // 2. Add an income transaction trace to Finances module
      const formattedDate = formatDateToSlash(collectDate);
      await db.saveTransaction({
        type: 'income',
        category: 'বকেয়া সংগ্রহ (ফি)',
        amount: amountToDeduct,
        date: formattedDate,
        status: 'Completed',
        note: `${selectedMember.name} (ID: ${selectedMember.id}) এর বকেয়া পরিশোধ - আদায় তারিখ: ${formattedDate}`
      });

      try {
        await db.addAuditLog('COLLECT_DUES', `বকেয়া ফি সংগ্রহ করা হয়েছে: ৳${amountToDeduct} -> সদস্য: ${selectedMember.name} (ID: ${selectedMember.id})`);
      } catch (_) {}

      alert(`৳${amountToDeduct} সফলভাবে আদায় করা হয়েছে এবং হিসাব-নিকাশ মডিউলে জমা হয়েছে!`);
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

  const handleChargeDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeMember) return;
    const amountToCharge = parseInt(chargeAmount) || 0;
    const currentDue = parseInt(String(chargeMember.dues).replace(/[^0-9]/g, '')) || 0;

    if (amountToCharge <= 0) {
      alert('সঠিক ও বৈধ বকেয়া চার্জের পরিমাণ প্রদান করুন!');
      return;
    }

    try {
      setIsSavingCharge(true);
      const updatedDue = currentDue + amountToCharge;
      
      const updatedMember = {
        ...chargeMember,
        dues: updatedDue
      };

      // Update member state in DB
      await db.saveMember(updatedMember);

      const formattedDate = formatDateToSlash(chargeDate);
      try {
        await db.addAuditLog('CHARGE_DUES', `বকেয়া চার্জ করা হয়েছে: ৳${amountToCharge} -> সদস্য: ${chargeMember.name} (ID: ${chargeMember.id}) - কারণ: ${chargeReason}`);
      } catch (_) {}

      alert(`৳${amountToCharge} বকেয়া সফলভাবে সদস্য '${chargeMember.name}' এর অ্যাকাউন্টে যোগ করা হয়েছে!`);
      setIsChargeModalOpen(false);
      setChargeMember(null);
      await loadMembers();
    } catch (err) {
      console.error('Charge due error:', err);
      alert('বকেয়া চার্জ সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSavingCharge(false);
    }
  };

  // Filter members based on rules
  const membersToRender = allMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'with-dues') {
      const dueVal = parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0;
      return dueVal > 0;
    }
    return true;
  });

  const totalDuesOfAll = allMembers.reduce((acc, m) => acc + (parseInt(String(m.dues).replace(/[^0-9]/g, '')) || 0), 0);

  const handleTriggerPrint = () => {
    try {
      window.print();
    } catch (e) {
      alert('আইফ্রেম রেস্ট্রিকশনের কারণে সরাসরি প্রিন্ট ব্যাহত হতে পারে। দয়া করে নতুন ট্যাবে খুলে ট্রাই করুন।');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left print:p-0">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্যদের বকেয়া ও ফি ব্যবস্থাপনা</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সব সদস্যদের বাৎসরিক ফি ও অন্যান্য বকেয়া তালিকা ও হিসাব</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[22px] font-black text-slate-700 transition-all text-xs active:scale-95"
          >
            <Printer className="w-4.5 h-4.5 text-indigo-500" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
          <div className="flex items-center space-x-3 bg-rose-50 p-2.5 rounded-[28px] border border-rose-100">
              <div className="px-6 py-2.5 bg-white rounded-[20px] shadow-xs">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block text-center mb-0.5">সর্বমোট বকেয়া পরিমাণ</span>
                  <span className="text-2xl font-black text-rose-600 block text-center">৳{totalDuesOfAll}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
            </div>
            <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end">
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setFilterType('with-dues')}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      filterType === 'with-dues' ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    বকেয়া তালিকা ({allMembers.filter(m => (parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setFilterType('all')}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      filterType === 'all' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    সকল সক্রিয় সদস্য ({allMembers.length})
                  </button>
                </div>
                <button 
                  onClick={loadMembers}
                  disabled={loading}
                  className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>
        </div>

        {loading && allMembers.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-450 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">সদস্য (Member)</th>
                  <th className="px-8 py-5">মোবাইল ফোন</th>
                  <th className="px-8 py-5">বকেয়া পরিমাণ (Balance)</th>
                  <th className="px-8 py-5">সক্রিয়তার তারিখ</th>
                  <th className="px-8 py-5 text-right print:hidden">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {membersToRender.map((member) => {
                  const mDues = parseInt(String(member.dues || '0').replace(/[^0-9]/g, '')) || 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 font-extrabold rounded-xl flex items-center justify-center border border-indigo-100">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">ECO-{member.id.padStart(4, '0')} | {member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-600 font-bold font-mono">{member.phone || 'N/A'}</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "font-black text-base px-3 py-1 rounded-full",
                          mDues > 0 ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-emerald-600 bg-emerald-50 border border-emerald-100"
                        )}>
                          ৳ {mDues}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-slate-400 font-bold">
                        {member.joinDate ? member.joinDate.split('|')[0] : 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => openChargeModal(member)}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                            title="বকেয়া চার্জ বা বিলম্ব ফি যোগ করুন"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ফি চার্জ করুন</span>
                          </button>
                          {mDues > 0 && (
                            <button 
                              onClick={() => openCollectModal(member)}
                              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-1"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                              <span>টাকা আদায়</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {membersToRender.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-250 mx-auto mb-4 animate-bounce" />
                            <p className="text-slate-500 font-extrabold text-sm">উপযুক্ত কোনো সদস্যের তথ্য পাওয়া যায়নি!</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">সব সদস্যদের হিসেব হালনাগাদ রয়েছে।</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Dues Modal with Advanced Selected Date Picker */}
      {isCollectModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">✓</div>
                <h3 className="text-lg font-black text-slate-950">বকেয়া সংগ্রহের রসিদ</h3>
              </div>
              <button 
                onClick={() => setIsCollectModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectDuesSubmit} className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2.5xl space-y-2.5 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">বকেয়া পরিশোধকারী: <strong className="text-slate-900 font-black">{selectedMember.name}</strong></p>
                <p className="text-xs font-bold text-slate-500">মেম্বার আইডি: <strong className="text-slate-800 font-mono font-black">ECO-{selectedMember.id.padStart(4, '0')}</strong></p>
                <p className="text-xs font-bold text-slate-500">বর্তমান মোট বকেয়া: <strong className="text-rose-600 font-black">৳{selectedMember.dues}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">সংগৃহীত টাকার পরিমাণ (৳)</label>
                <input 
                  type="number"
                  required
                  min={1}
                  max={parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 9999}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-emerald-500 focus:bg-white rounded-2xl text-base font-black focus:outline-none transition-all"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                />
              </div>

              {/* Advanced Calendar Date Selector implemented here */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">টাকা আদায়ের প্রকৃত তারিখ (Validation Date)</label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 focus:outline-none transition-all font-sans"
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-2 text-[10px] text-slate-450 font-bold leading-relaxed">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>টাকা আদায় সম্পন্ন করলে বকেয়ার পরিমাণ কমে যাবে এবং লাইভ ক্যাশবুকে নির্ধারিত "টাকা আদায়ের তারিখে" আয় হিসেবে জমা দেখানো হবে।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
                  disabled={isSavingCollection}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                  disabled={isSavingCollection}
                >
                  {isSavingCollection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>আদায় হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আদায় নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Charge Due Modal with Advanced Calendar selector */}
      {isChargeModalOpen && chargeMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold font-sans">+</div>
                <h3 className="text-lg font-black text-slate-950">নতুন বকেয়া চার্জ যোগ</h3>
              </div>
              <button 
                onClick={() => {
                  setIsChargeModalOpen(false);
                  setChargeMember(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChargeDueSubmit} className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2.5xl space-y-2 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">বকেয়া গ্রহীতা: <strong className="text-slate-900 font-black">{chargeMember.name}</strong></p>
                <p className="text-xs font-bold text-slate-500">মেম্বার আইডি: <strong className="text-slate-850 font-mono font-black">ECO-{chargeMember.id.padStart(4, '0')}</strong></p>
                <p className="text-xs font-bold text-slate-500">বর্তমান মোট বকেয়া: <strong className="text-rose-600 font-black">৳{chargeMember.dues}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জ পরিমাণ (৳)</label>
                <input 
                  type="number"
                  required
                  min={1}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-rose-500 focus:bg-white rounded-2xl text-base font-black focus:outline-none transition-all"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জের কারণ (Reason/Category)</label>
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all"
                  value={chargeReason}
                  onChange={(e) => setChargeReason(e.target.value)}
                >
                  <option value="বাৎসরিক মেম্বারশিপ বকেয়া ফি">বাৎসরিক মেম্বারশিপ বকেয়া ফি (৳৫০)</option>
                  <option value="বই ফেরত প্রদানের বিলম্ব জরিমানা">বই ফেরত প্রদানের বিলম্ব জরিমানা</option>
                  <option value="বইয়ের ক্ষতিপূরণ ফি">বইয়ের ক্ষতিপূরণ ফি</option>
                  <option value="অন্যান্য সেবামূলক বকেয়া">অন্যান্য সেবামূলক বকেয়া</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জের তারিখ (Charge Calendar Date)</label>
                <input 
                  type="date"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all font-sans"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsChargeModalOpen(false);
                    setChargeMember(null);
                  }}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
                  disabled={isSavingCharge}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-rose-600 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5"
                  disabled={isSavingCharge}
                >
                  {isSavingCharge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>রানিং...</span>
                    </>
                  ) : (
                    <span>চার্জ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Printable Report Dialog Center */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-6 h-6 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-xl font-black text-slate-900">পাঠাগার বকেয়া ফিল্ড রিপোর্ট প্রিন্ট সেন্টার</h3>
                  <p className="text-[10px] font-bold text-slate-400">মেম্বারদের মাসিক ফি ও পেন্ডিং পাওনার অফিশিয়াল তালিকা</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser security notice for sandbox environment */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs font-bold text-amber-900 space-y-1 print:hidden mb-6">
              <p className="font-black">📌 ব্রাউজার সিকিউরিটি নোটিশ (Iframe Security Warning):</p>
              <p className="leading-relaxed text-[11px] opacity-90">
                আপনি বর্তমানে এআই স্টুডিওর স্যান্ডবক্স আইফ্রেমের (Iframe) ভেতরে আছেন। ব্রাউজার সিকিউরিটির নিয়মানুযায়ী আইফ্রেম থেকে সরাসরি "প্রিন্ট" বাটন ব্লক হতে পারে। প্রিন্ট সঠিক না হলে দয়া করে উপরের অ্যাড্রেস বার সংলগ্ন <strong className="text-indigo-750 border-b border-indigo-300">"Open in New Tab" / "নতুন ট্যাবে খুলুন"</strong> বাটনে ক্লিক করে মূল ওয়েবসাইটে প্রবেশ করুন এবং ওখান থেকে এক ক্লিকে সম্পূর্ণ রিপোর্টটি পিডিএফ বা পেপারে প্রিন্ট করে নিন।
              </p>
            </div>

            {/* The Print Layout Frame representing exactly what will be printed */}
            <div id="printable-area-for-dues" className="bg-slate-50 p-6 sm:p-10 rounded-[24px] border border-slate-200 text-left overflow-x-auto min-h-[400px]">
              <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 sm:p-12 shadow-md rounded-[16px] border border-slate-100">
                {/* Letterhead */}
                <div className="text-center pb-6 border-b-2 border-indigo-600 space-y-1">
                  <h1 className="text-3xl font-black text-slate-900">অর্থনীতি উন্মুক্ত পাঠাগার</h1>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Department of Economics, MBSTU</p>
                  <p className="text-[11px] text-slate-450 font-bold">মাস্টারদা সূর্যসেন হল রোড, টাঙ্গাইল, বাংলাদেশ।</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <p>রিপোর্ট টাইপ: <strong className="text-slate-950 font-extrabold">সদস্যদের বাৎসরিক ফি ও বকেয়া তালিকা</strong></p>
                    <p>তারিখ: <strong className="text-slate-950 font-semibold font-mono">{new Date().toLocaleDateString('bn-BD')}</strong></p>
                  </div>
                  <div className="sm:text-right space-y-1">
                    <p>মোট বকেয়া যুক্ত সদস্য: <strong className="text-slate-950">{allMembers.filter(m => (parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0) > 0).length} জন</strong></p>
                    <p>মোট বকেয়ার পরিমাণ: <strong className="text-rose-600 font-black">৳ {totalDuesOfAll}</strong></p>
                  </div>
                </div>

                {/* Printable Table */}
                <table className="w-full text-xs text-left border-collapse border border-slate-200 mt-6">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-800 border-b border-slate-205">
                      <th className="p-2 border border-slate-200">সদস্য আইডি ও নাম</th>
                      <th className="p-2 border border-slate-200" style={{ minWidth: '150px' }}>যোগদান ও মেয়াদের অবস্থা (মাস)</th>
                      <th className="p-2 border border-slate-200 text-right">বাৎসরিক ফি (৳)</th>
                      <th className="p-2 border border-slate-200 text-right">অন্যান্য বকেয়া (৳)</th>
                      <th className="p-2 border border-slate-200 text-right" style={{ minWidth: '80px' }}>মোট বকেয়া (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.map((member) => {
                      const mDues = parseInt(String(member.dues || '0').replace(/[^0-9]/g, '')) || 0;
                      const yearlyFee = calculateYearlyFeesOwedOnly(member);
                      const baseDue = member.baseDues ?? 0;
                      
                      const baseDateStr = member.validationStartDate || (member.joinDate ? member.joinDate.split('|')[0] : '');
                      const baseDate = baseDateStr ? parseAnyDate(baseDateStr) : null;
                      const today = new Date();

                      let dateBreakdownText = '';
                      if (baseDate) {
                        const mDiff = getMonthsBetween(baseDate, today);
                        const isPaid = member.yearlyFeeStatus === 'paid';
                        if (isPaid) {
                          dateBreakdownText = `${baseDateStr} (মেয়াদ: ${member.paidUntilDate || 'N/A'})`;
                        } else {
                          dateBreakdownText = `${baseDateStr} (${mDiff} মাস অতিবাহিত, অপ্রদত্ত)`;
                        }
                      } else {
                        dateBreakdownText = member.joinDate ? member.joinDate.split('|')[0] : 'N/A';
                      }

                      return (
                        <tr key={member.id} className="border-b border-slate-150 odd:bg-slate-50/50">
                          <td className="p-2 border border-slate-200">
                            <span className="font-mono font-bold block text-slate-700">ECO-{member.id.padStart(4, '0')}</span>
                            <span className="font-extrabold text-slate-900 text-[11px] block">{member.name}</span>
                          </td>
                          <td className="p-2 border border-slate-200 text-[10px] font-bold text-slate-500 leading-tight">
                            {dateBreakdownText}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold font-mono text-slate-700">
                            ৳{yearlyFee}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold font-mono text-slate-500">
                            ৳{baseDue}
                          </td>
                          <td className={`p-2 border border-slate-200 text-right font-black font-mono text-sm ${mDues > 0 ? "text-rose-600 bg-rose-50/20" : "text-emerald-600"}`}>
                            ৳{mDues}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer section */}
                <div className="pt-20 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <div className="text-center w-36">
                    <div className="border-t border-slate-300 pt-1">নিরীক্ষক স্বাক্ষর</div>
                  </div>
                  <div className="text-center w-36">
                    <div className="border-t border-slate-305 border-slate-300 pt-1">প্রধান অ্যাডমিন স্বাক্ষর</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Actions inside print modal */}
            <div className="flex justify-end space-x-3 mt-6 print:hidden">
              <button 
                type="button" 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
              <button 
                type="button" 
                onClick={handleTriggerPrint}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>রিপোর্ট প্রিন্ট করুন / PDF ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
