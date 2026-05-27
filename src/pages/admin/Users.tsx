import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users as UsersIcon, Search, Filter, 
  MoreVertical, UserPlus, Mail, Phone,
  CheckCircle2, XCircle, Shield, Trash2,
  Edit2, Loader2, RefreshCw, X, Printer,
  MapPin, Briefcase, Calendar as CalendarIcon,
  Download, Send, Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseMember } from '@/src/lib/supabaseDatabase';
import { motion, AnimatePresence } from 'motion/react';

const initialMembers: any[] = [];

export default function AdminUsers() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(new URLSearchParams(location.search).get('search') || '');
  const [members, setMembers] = useState<SupabaseMember[]>(initialMembers as any[]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SupabaseMember | null>(null);
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [noticeResult, setNoticeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [noticeMessage, setNoticeMessage] = useState('');

  const loadMembers = async () => {
    try {
      setLoading(true);
      const fetched = await db.getMembers();
      setMembers(fetched);
      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendNotice = async () => {
    if (!selectedMember || !noticeMessage) return;
    
    setIsSendingNotice(true);
    setNoticeResult(null);

    try {
      // Simulate real-time dispatch or write to DB
      setNoticeResult({ success: true, message: 'সদস্যকে সফলভাবে নোটিশ পাঠানো হয়েছে!' });
      setNoticeMessage('');
    } catch (err) {
      setNoticeResult({ success: false, message: 'পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setIsSendingNotice(false);
    }
  };

  const handleStatusUpdate = async (member: SupabaseMember, newStatus: 'accepted' | 'rejected') => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে এই সদস্যকে ${newStatus === 'accepted' ? 'সক্রিয়' : 'বাতিল'} করতে চান?`)) {
      return;
    }

    try {
      setLoading(true);
      const updated = {
        ...member,
        status: newStatus
      };
      await db.saveMember(updated);
      setSelectedMember(updated);
      await loadMembers();
      alert(`সদস্যের স্ট্যাটাস সফলভাবে ${newStatus === 'accepted' ? 'সক্রিয়' : 'বাতিল'} করা হয়েছে!`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('স্ট্যাটাস সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePayDues = async (member: SupabaseMember) => {
    const amountStr = window.prompt(`প্রবেশ করান পরিশোধিত পরিমাণ (সর্বোচ্চ ৳${member.dues}):`, String(member.dues));
    if (amountStr === null) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > member.dues) {
      alert('সদস্যের বকেয়া পরিশোধের জন্য সঠিক ও বৈধ পরিমাণ দিন!');
      return;
    }

    try {
      setLoading(true);
      const updated = {
        ...member,
        dues: member.dues - amount
      };
      await db.saveMember(updated);
      setSelectedMember(updated);
      await loadMembers();
      alert(`৳${amount} সফলভাবে পরিশোধ করা হয়েছে! অবশিষ্ট বকেয়া: ৳${updated.dues}`);
    } catch (err: any) {
      console.error('Failed to update dues:', err);
      alert('বকেয়া পরিশোধ সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্য ব্যবস্থাপনা</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {members.length} জন নিবন্ধিত সদস্য</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ শিট
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadMembers}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <UserPlus className="w-5 h-5" />
            <span>নতুন সদস্য</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">সদস্য (Member)</th>
                <th className="px-8 py-5">বিস্তারিত</th>
                <th className="px-8 py-5">স্ট্যাটাস</th>
                <th className="px-8 py-5">ভূমিকা</th>
                <th className="px-8 py-5 text-right">বকেয়া (Dues)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => setSelectedMember(member)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      {member.photo && member.photo !== "" ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900 line-clamp-1">{member.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full inline-block mt-1">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-500 font-bold text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.email}
                      </div>
                      <div className="flex items-center text-slate-400 font-bold text-[10px]">
                        <Phone className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      member.status === 'accepted' || member.status === 'active'
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : member.status === 'pending'
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {member.status === 'accepted' ? 'সক্রিয়' : member.status === 'pending' ? 'পেন্ডিং' : member.status === 'rejected' ? 'বাতিল' : member.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-slate-600 font-black">
                      <Shield className="w-4 h-4 mr-2 text-indigo-400" />
                      {member.role}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "font-black text-lg",
                      member.dues > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      ৳{member.dues}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none"
            >
              {/* Profile Card Header */}
              <div className="relative h-40 bg-indigo-600 print:hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-8 right-8 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-10 pb-10">
                <div className="relative -mt-20 flex flex-col md:flex-row md:items-end gap-6 mb-10">
                  <div className="w-40 h-40 bg-white p-2 rounded-[40px] shadow-2xl print:shadow-none">
                    {selectedMember.photo && selectedMember.photo !== "" ? (
                      <img 
                        src={selectedMember.photo} 
                        alt={selectedMember.name} 
                        className="w-full h-full object-cover rounded-[32px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-[32px] flex items-center justify-center text-indigo-600 text-5xl font-black">
                        {selectedMember.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h3 className="text-3xl font-black text-slate-900 mb-2">{selectedMember.name}</h3>
                    <p className="text-indigo-600 font-black flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      {selectedMember.role} Member
                    </p>
                  </div>
                  <div className="flex gap-3 print:hidden">
                    <button 
                      onClick={handlePrint}
                      className="w-14 h-14 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-[22px] flex items-center justify-center border border-slate-100 transition-all shadow-sm active:scale-95"
                      title="প্রিন্ট করুন"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                    {selectedMember.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(selectedMember, 'accepted')}
                          className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs shrink-0"
                        >
                          সক্রিয় করুন
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedMember, 'rejected')}
                          className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs shrink-0"
                        >
                          বাতিল করুন
                        </button>
                      </>
                    ) : selectedMember.status === 'accepted' || selectedMember.status === 'active' ? (
                      <button 
                        onClick={() => handleStatusUpdate(selectedMember, 'rejected')}
                        className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs"
                      >
                        নিষ্ক্রিয়/বাতিল করুন
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusUpdate(selectedMember, 'accepted')}
                        className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs"
                      >
                        সক্রিয় করুন
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">যোগাযোগ</h4>
                      <div className="space-y-4">
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm">
                            <Mail className="w-5 h-5 text-indigo-400" />
                          </div>
                          <span className="font-bold">{selectedMember.email}</span>
                        </div>
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm">
                            <Phone className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="font-bold">{selectedMember.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">বিবিধ</h4>
                      <div className="space-y-4">
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm">
                            <Briefcase className="w-5 h-5 text-amber-400" />
                          </div>
                          <span className="font-bold">{selectedMember.occupation || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm">
                            <MapPin className="w-5 h-5 text-rose-400" />
                          </div>
                          <span className="font-bold">{selectedMember.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative z-10">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">আইডি কার্ড তথ্য</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase">মেম্বার আইডি</p>
                            <p className="text-xl font-black">{selectedMember.id}</p>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase">যোগদান</p>
                              <p className="font-bold">{selectedMember.joinDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase">স্ট্যাটাস</p>
                              <p className={cn(
                                "font-black uppercase",
                                selectedMember.status === 'accepted' || selectedMember.status === 'active' ? "text-emerald-400" : 
                                selectedMember.status === 'pending' ? "text-amber-400" : "text-rose-400"
                              )}>{selectedMember.status === 'accepted' ? 'সক্রিয়' : selectedMember.status === 'pending' ? 'পেন্ডিং' : selectedMember.status === 'rejected' ? 'বাতিল' : selectedMember.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] text-emerald-900 flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-black uppercase opacity-60 mb-1">মোট বকেয়া</p>
                         <p className="text-3xl font-black">৳ {selectedMember.dues}</p>
                       </div>
                       {selectedMember.dues > 0 && (
                         <button 
                           onClick={() => handlePayDues(selectedMember)}
                           className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95"
                         >
                           পরিশোধ করুন
                         </button>
                       )}
                    </div>

                    {/* Notice Section */}
                    <div className="bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100/50 print:hidden">
                       <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">নোটিশ পাঠান</h4>
                         </div>
                         {noticeResult && (
                           <span className={cn(
                             "text-[10px] font-black px-3 py-1 rounded-full",
                             noticeResult.success ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                           )}>
                             {noticeResult.message}
                           </span>
                         )}
                       </div>
                       <div className="relative">
                          <textarea 
                            value={noticeMessage}
                            onChange={(e) => setNoticeMessage(e.target.value)}
                            placeholder="সদস্যকে কোনো বার্তা বা নোটিশ দিন..."
                            className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 min-h-[100px]"
                          />
                          <button 
                            onClick={handleSendNotice}
                            disabled={isSendingNotice || !noticeMessage}
                            className="absolute right-3 bottom-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                          >
                            {isSendingNotice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Print only footer */}
                <div className="hidden print:block mt-10 border-t border-slate-100 pt-8 text-center">
                  <p className="text-xs font-bold text-slate-400 italic">এই প্রফাইলটি স্বয়ংক্রিয়ভাবে পাঠাগার ব্যবস্থাপনা সিস্টেম থেকে তৈরি করা হয়েছে।</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
