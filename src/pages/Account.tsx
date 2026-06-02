import { 
  TrendingUp, TrendingDown, Wallet, User as UserIcon, Phone, MapPin, 
  AtSign, Book as BookIcon, History, LogOut, Loader2, AlertCircle, ShoppingCart, 
  Receipt, Calendar, ShieldAlert, Award, Check, Sparkles, Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, SupabaseMember as SheetMember, SupabaseIssue as SheetIssue, SupabaseOrder } from '@/src/lib/supabaseDatabase';
import { cn } from '@/src/lib/utils';
import IdCardDownloader from '../components/admin/IdCardDownloader';

export default function Account() {
  const [user, setUser] = useState<SheetMember | null>(null);
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'orders'>('current');
  const [lang, setLang] = useState<string>('BN');
  const navigate = useNavigate();

  // Library Card states
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [cardSuccessMsg, setCardSuccessMsg] = useState<string | null>(null);
  const [editRoll, setEditRoll] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editBlood, setEditBlood] = useState('');
  const [editDept, setEditDept] = useState('');

  useEffect(() => {
    if (user) {
      setEditRoll(user.studentRoll || '');
      setEditBatch(user.batchSession || '');
      setEditBlood(user.bloodGroup || '');
      setEditDept(user.department || '');
    }
  }, [user]);

  const handleSaveCardDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSavingCard(true);
      setCardSuccessMsg(null);
      
      const updatedUser = await db.saveMember({
        ...user,
        studentRoll: editRoll,
        batchSession: editBatch,
        bloodGroup: editBlood,
        department: editDept
      });

      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      setCardSuccessMsg(lang === 'BN' ? 'লাইব্রেরি কার্ডের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!' : 'Library card details updated successfully!');
      
      setTimeout(() => {
        setCardSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      alert('সংশোধন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSavingCard(false);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_lang') || 'BN';
    setLang(savedLang);

    const handleStorage = () => {
      const currentLang = localStorage.getItem('preferred_lang') || 'BN';
      setLang(currentLang);
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (!savedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const loadData = async () => {
      try {
        setLoading(true);

        let upToDateUser = parsedUser;
        try {
          const members = await db.getMembers();
          const found = members.find(m => 
            (m.email && m.email.toLowerCase() === (parsedUser.email || '').toLowerCase()) ||
            m.id === parsedUser.id
          );
          if (found) {
            upToDateUser = found;
            setUser(found);
            localStorage.setItem('loggedInUser', JSON.stringify(found));
          }
        } catch (mErr) {
          console.warn('Failed to refresh user profile from database on Account page:', mErr);
        }

        // Fetch book loans
        const queryIssues = await db.getIssues();
        const userIssues = queryIssues.filter(i => {
          if (!upToDateUser || !upToDateUser.name) return false;

          const issueMemberName = (i.memberName || '').trim().toLowerCase();
          const currentMemberName = upToDateUser.name.trim().toLowerCase();

          if (currentMemberName.length < 2) return false;

          // Robust mapping criteria
          const isExactName = issueMemberName === currentMemberName;
          const isIdMatch = upToDateUser.id && issueMemberName.includes(String(upToDateUser.id).toLowerCase());
          const isPhoneMatch = upToDateUser.phone && upToDateUser.phone.length > 5 && issueMemberName.includes(upToDateUser.phone);
          const isEmailMatch = upToDateUser.email && upToDateUser.email.length > 5 && issueMemberName.includes(upToDateUser.email.toLowerCase());

          return isExactName || isIdMatch || isPhoneMatch || isEmailMatch;
        });
        setIssues(userIssues);

        // Fetch store / shop orders
        const queryOrders = await db.getOrders();
        const userOrders = queryOrders.filter(o => {
          if (!upToDateUser) return false;
          const matchesId = o.memberId === upToDateUser.id;
          const matchesEmail = upToDateUser.email && o.customerEmail && o.customerEmail.toLowerCase() === upToDateUser.email.toLowerCase();
          return matchesId || matchesEmail;
        });
        setOrders(userOrders);
      } catch (err) {
        console.error('Failed to load user account data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const currentBooks = issues.filter(i => i.status !== 'Returned' && i.status !== 'Rejected');
  const pastBooks = issues.filter(i => i.status === 'Returned' || i.status === 'Rejected');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-slate-50 min-h-screen">
      {/* Header / Profile Header */}
      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12 relative z-10 text-center md:text-left">
          <div className="relative">
            <div className="w-40 h-40 rounded-[48px] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden">
              {user.photo && user.photo !== "" ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-5xl font-black">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className={cn(
              "absolute -bottom-2 -right-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-fade-in",
              user.status === 'accepted' || user.status === 'active' ? "bg-emerald-500 text-white" : 
              user.status === 'pending' ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
            )}>
              {user.status === 'accepted' || user.status === 'active'
                ? (lang === 'BN' ? 'সক্রিয়' : 'Active') 
                : user.status === 'pending' 
                ? (lang === 'BN' ? 'পেন্ডিং' : 'Pending') 
                : user.status === 'rejected' 
                ? (lang === 'BN' ? 'বাতিল' : 'Rejected') 
                : user.status}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">{user.name}</h1>
                <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">
                  {lang === 'BN' ? 'সদস্য আইডি:' : 'Member ID:'} {user.id}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-rose-100 transition-all self-center md:self-start"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'BN' ? 'লগআউট' : 'Logout'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold truncate">{user.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <AtSign className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold truncate">{user.occupation || (lang === 'BN' ? 'সদস্য' : 'Member')}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold truncate">{user.address || (lang === 'BN' ? 'ঠিকানা দেয়া হয়নি' : 'Address not set')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-left">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <BookIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {lang === 'BN' ? 'বর্তমানে কাছে আছে' : 'Currently Borrowed'}
              </span>
           </div>
           <div className="text-4xl font-black text-slate-900">
             {currentBooks.length} {lang === 'BN' ? 'টি' : 'Books'}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-left">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                 <History className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {lang === 'BN' ? 'মোট পড়া বই' : 'Total Read Books'}
              </span>
           </div>
           <div className="text-4xl font-black text-slate-900">
             {pastBooks.length} {lang === 'BN' ? 'টি' : 'Books'}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-left animate-in fade-in">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <Receipt className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {lang === 'BN' ? 'মোট শপ অর্ডার' : 'Total Store Orders'}
              </span>
           </div>
           <div className="text-4xl font-black text-slate-900">
             {orders.length} {lang === 'BN' ? 'টি' : 'Orders'}
           </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-indigo-100 relative overflow-hidden group text-left">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 text-indigo-300 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {lang === 'BN' ? 'বকেয়া পরিমাণ' : 'Outstanding Dues'}
                  </span>
              </div>
               <div className="text-4xl font-black text-white">৳ {user.dues}</div>
            </div>
         </div>
      </div>

      {/* Books & Orders List Section in responsive columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="p-8 border-b border-slate-50 flex flex-wrap gap-4 md:space-x-8">
             <button 
              onClick={() => setActiveTab('current')}
              className={`text-xs md:text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${activeTab === 'current' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}
             >
               {lang === 'BN' ? 'বর্তমানে পঠিত বই' : 'Current Book Loans'} ({currentBooks.length})
             </button>
             <button 
              onClick={() => setActiveTab('history')}
              className={`text-xs md:text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${activeTab === 'history' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}
             >
               {lang === 'BN' ? 'পুরানো পঠিত রেকর্ড' : 'Reading History'} ({pastBooks.length})
             </button>
             <button 
              onClick={() => setActiveTab('orders')}
              className={`text-xs md:text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${activeTab === 'orders' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}
             >
               {lang === 'BN' ? 'আমার বুক অর্ডার শপ' : 'My Bookstore Orders'} ({orders.length})
             </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'orders' ? (
                  orders.length === 0 ? (
                    <div className="py-20 text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Receipt className="w-10 h-10 text-slate-200" />
                       </div>
                       <p className="text-slate-400 font-bold">আপনি শপ থেকে এখনো কোনো বই অর্ডার করেননি</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {orders.map((order) => (
                        <div key={order.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">ID: #{order.id}</span>
                            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {order.date}
                            </span>
                          </div>
                          
                          <h3 className="font-extrabold text-slate-800 text-base mb-2 leading-snug line-clamp-2">{order.items}</h3>
                          
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 font-bold">পেমেন্ট স্ট্যাটাস:</span>
                              <span className="text-xs font-black text-slate-700">পরিশোধিত (M-Wallet)</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-400 font-bold">মোট বইয়ের মূল্য:</span>
                              <span className="text-emerald-500 font-extrabold text-base">৳ {order.total}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                               <span className="text-xs font-bold text-slate-400">অর্ডার স্ট্যাটাস:</span>
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                 order.status === 'Pending' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                 order.status === 'Shipped' || order.status === 'Delivered' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                 "bg-rose-100 text-rose-700 border border-rose-200"
                               )}>
                                 {order.status === 'Pending' ? 'পেন্ডিং (অ্যাডমিন রিভিউ)' : 
                                  order.status === 'Shipped' ? 'গৃহীত ও শিপড (Accepted)' : 
                                  order.status === 'Delivered' ? 'ডেলিভার্ড সম্পন্ন' : 
                                  'বাতিল করা হয়েছে'}
                               </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (activeTab === 'current' ? currentBooks : pastBooks).length === 0 ? (
                  <div className="py-20 text-center">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookIcon className="w-10 h-10 text-slate-200" />
                     </div>
                     <p className="text-slate-400 font-bold">কোনো লোন বা ধারের রেকর্ড পাওয়া যায়নি</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(activeTab === 'current' ? currentBooks : pastBooks).map((issue) => (
                      <div key={issue.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:shadow-xl transition-all flex flex-col justify-between">
                         <div>
                            <h3 className="font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">{issue.bookTitle}</h3>
                            
                            <div className="space-y-3">
                               <div className="flex justify-between text-xs font-bold">
                                 <span className="text-slate-400">{issue.status === 'Pending' ? 'আবেদনের তারিখ:' : 'ইস্যু তারিখ:'}</span>
                                 <span className="text-slate-600">{issue.issueDate}</span>
                               </div>
                               
                               {issue.status !== 'Pending' && (
                                 <div className="flex justify-between text-xs font-bold">
                                   <span className="text-slate-400">ফেরত তারিখ:</span>
                                   <span className={`px-2 py-0.5 rounded-lg ${issue.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 'text-slate-600'}`}>
                                       {issue.dueDate}
                                   </span>
                                 </div>
                               )}

                               {issue.pickupDate && (
                                 <div className="p-3 bg-indigo-50/70 border border-indigo-150 rounded-2xl text-xs font-bold text-slate-700 leading-snug mt-2">
                                   <p className="text-indigo-800 font-extrabold mb-1 flex items-center gap-1.5 pt-0.5">
                                     <Calendar className="w-4 h-4 shrink-0 text-indigo-600 animate-bounce" />
                                     বই সংগ্রহের নির্ধারিত সময়:
                                   </p>
                                   <p className="text-[11px] bg-white px-2.5 py-1 text-indigo-700 font-extrabold rounded-lg border border-indigo-100 mt-1 inline-block">{issue.pickupDate}</p>
                                 </div>
                               )}

                               {issue.status === 'Pending' && (
                                 <div className="p-3 bg-amber-50/70 border border-amber-150 rounded-2xl text-[10px] font-bold text-slate-500 leading-relaxed mt-2 italic">
                                   ⏳ আপনার আবেদনটি সফলভাবে জমা হয়েছে। কো-অর্ডিনেটর কর্তৃক পর্যালোচনার পর সংগ্রহের সময় ও দিন জানিয়ে দেওয়া হবে।
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="pt-4 mt-6 flex items-center justify-between border-t border-slate-100/60">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                              issue.status === 'Returned' ? 'bg-emerald-100 text-emerald-600' : 
                              issue.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse' :
                              issue.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                              issue.status === 'Overdue' ? 'bg-rose-105 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              {issue.status === 'Pending' ? 'আবেদন পেন্ডিং' :
                               issue.status === 'Rejected' ? 'বাতিল' :
                               issue.status === 'Returned' ? 'ফেরত সম্পন্ন' : 
                               issue.status === 'Overdue' ? 'মেয়াদ উত্তীর্ণ' : 'চলতি লোন'}
                            </span>
                            {issue.status === 'Overdue' && (
                               <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Digital Member ID card download sideboard */}
        <div className="w-full space-y-6">
          {(user.status === 'accepted' || user.status === 'active') ? (
            <IdCardDownloader member={user} />
          ) : (
            <div className="bg-amber-50 border border-amber-100/60 p-8 rounded-[32px] text-left text-slate-700 space-y-4 col-special">
              <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                আইডি কার্ড তৈরি হচ্ছে…
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-550 font-medium">
                আপনার মেম্বারশিপ অ্যাকাউন্টটি সক্রিয় হলে এবং কো-অর্ডিনেটর কর্তৃক আপনার বার্ষিক চার্জ ও অনুমোদন সম্পন্ন হলে আপনার স্বয়ংক্রিয় লাইভ ডিজিটাল পরিচয়পত্র (ID Card) এখানে প্রদর্শিত হবে। কো-অর্ডিনেটর কর্তৃক অনুমোদন সম্পন্ন হওয়া পর্যন্ত দয়া করে অপেক্ষা করুন।
              </p>
            </div>
          )}

          {/* EDIT DETAILS CARD FORM */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-5 text-left">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-55">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                 <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {lang === 'BN' ? 'লাইব্রেরি কার্ডের তথ্য সংশোধন' : 'Update Library Card Info'}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {lang === 'BN' ? 'ডিজিটাল কার্ডে প্রদর্শিত হবে এমন একাডেমিক ও ব্যক্তিগত বিবরণী সংরক্ষণ করুন' : 'Edit academic details printed on your physical member card'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCardDetails} className="space-y-4 pt-1">
              {/* Session / Batch */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">
                  {lang === 'BN' ? 'সেশন / ব্যাচ (Session/Batch)' : 'Session / Batch'}
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 shrink-0 pointer-events-none" />
                  <input 
                    type="text"
                    required
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    placeholder="উদা: ২০২০-২০২১"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-600 transition-all animate-none"
                  />
                </div>
              </div>

              {/* Student Roll / ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">
                  {lang === 'BN' ? 'রোল নম্বর / আইডি (Roll/ID)' : 'Student Roll / ID'}
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 shrink-0 pointer-events-none" />
                  <input 
                    type="text"
                    required
                    value={editRoll}
                    onChange={(e) => setEditRoll(e.target.value)}
                    placeholder="উদা: ECO-20023"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-600 transition-all animate-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">
                  {lang === 'BN' ? 'বিভাগের নাম (Department)' : 'Department Name'}
                </label>
                <div className="relative">
                  <Library className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 shrink-0 pointer-events-none" />
                  <input 
                    type="text"
                    required
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    placeholder="উদা: অর্থনীতি বিভাগ"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-600 transition-all animate-none"
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">
                  {lang === 'BN' ? 'রক্তের গ্রুপ (Blood Group)' : 'Blood Group'}
                </label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 shrink-0 pointer-events-none" />
                  <select 
                    required
                    value={editBlood}
                    onChange={(e) => setEditBlood(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-850 focus:outline-none focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-600 transition-all"
                  >
                    <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Status Indicator */}
              {cardSuccessMsg && (
                <div className="p-3 bg-emerald-55/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-[10px] font-bold flex items-center space-x-2 animate-pulse mt-2 bg-emerald-50">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{cardSuccessMsg}</span>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSavingCard}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-2"
              >
                {isSavingCard ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{lang === 'BN' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{lang === 'BN' ? 'সংরক্ষণ করুন' : 'Save Details'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
