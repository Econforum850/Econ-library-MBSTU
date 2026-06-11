import { 
  TrendingUp, TrendingDown, Wallet, User as UserIcon, Phone, MapPin, 
  AtSign, Book as BookIcon, History, LogOut, Loader2, AlertCircle, ShoppingCart, 
  Receipt, Calendar, ShieldAlert, Award, Check, Sparkles, Library, RefreshCw, Send
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
  const [sidebarTab, setSidebarTab] = useState<'id-card' | 'card-edit'>('id-card');
  const navigate = useNavigate();

  const getDaysRemainingValue = (dueDateStr: string): number => {
    if (!dueDateStr) return 9999;
    const parts = dueDateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        parsed.setHours(0, 0, 0, 0);
        const diffTime = parsed.getTime() - today.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return 9999;
  };

  const toBengaliNumber = (numStr: string | number): string => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(numStr).replace(/[0-9]/g, (digit) => bDigits[parseInt(digit)]);
  };

  // Library Card states
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [cardSuccessMsg, setCardSuccessMsg] = useState<string | null>(null);
  const [editRoll, setEditRoll] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editBlood, setEditBlood] = useState('');
  const [editDept, setEditDept] = useState('');

  // Renewal and Lost Card Reissue States
  const [requestingRenewal, setRequestingRenewal] = useState(false);
  const [requestingReissue, setRequestingReissue] = useState(false);

  const handleRequestRenewal = async () => {
    if (!user) return;
    try {
      setRequestingRenewal(true);
      const updatedUser = await db.saveMember({
        ...user,
        renewalStatus: 'requested'
      });
      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      try {
        await db.addAuditLog('RENEWAL_REQUEST', `মেম্বারশিপ নবায়নের অনুরোধ: ${user.name} (ID: ${user.id})`);
      } catch (_) {}
      alert(lang === 'BN' ? 'মেম্বারশিপ নবায়ন আবেদন সফলভাবে জমা হয়েছে!' : 'Membership renewal application submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('আবেদন জমা করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setRequestingRenewal(false);
    }
  };

  const handleRequestReissue = async () => {
    if (!user) return;
    
    const confirmReq = window.confirm(lang === 'BN' 
      ? 'আপনি কি নিশ্চিতভাবে এই আইডি কার্ডটির বদলে একটি নতুন কার্ড রি-ইস্যু করার আবেদন করতে চান?' 
      : 'Are you sure you want to request a reissue of your library card?');
    if (!confirmReq) return;

    try {
      setRequestingReissue(true);
      const updatedUser = await db.saveMember({
        ...user,
        lostCardStatus: 'requested'
      });
      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      try {
        await db.addAuditLog('REISSUE_REQUEST', `কার্ড রি-ইস্যু অনুরোধ: ${user.name} (ID: ${user.id})`);
      } catch (_) {}
      alert(lang === 'BN' ? 'কার্ড রি-ইস্যু আবেদন সফলভাবে জমা হয়েছে!' : 'Card reissue application submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('আবেদন জমা করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setRequestingReissue(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEditRoll(user.studentRoll || '');
      setEditBatch(user.batchSession || '');
      setEditBlood(user.bloodGroup || '');
      setEditDept('Department of Economics');
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

            <div className="grid grid-cols-2 gap-3.5 md:gap-5 text-left w-full mt-4">
              <div className="flex items-center space-x-3 bg-slate-50/65 p-3.5 rounded-[20px] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all duration-300 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">{lang === 'BN' ? 'মোবাইল নম্বর' : 'Phone'}</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-1 leading-none">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-slate-50/65 p-3.5 rounded-[20px] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all duration-300 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shrink-0">
                  <AtSign className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">{lang === 'BN' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-1 leading-none" title={user.email}>{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-slate-50/65 p-3.5 rounded-[20px] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all duration-300 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">{lang === 'BN' ? 'পেশা / পদবী' : 'Occupation'}</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-1 leading-none">{user.occupation || (lang === 'BN' ? 'স্টুডেন্ট / সদস্য' : 'Student')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-slate-50/65 p-3.5 rounded-[20px] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all duration-300 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">{lang === 'BN' ? 'বর্তমান ঠিকানা' : 'Address'}</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-1 leading-none">{user.address || (lang === 'BN' ? 'ঠিকানা দেয়া হয়নি' : 'Address not set')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
        {/* Card 1: Currently Borrowed */}
        <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left hover:scale-[1.02] transition-transform duration-300">
           <div className="flex items-center space-x-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50/70 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                 <BookIcon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">
                {lang === 'BN' ? 'বর্তমানে ধারকৃত' : 'Currently Borrowed'}
              </span>
           </div>
           <div className="text-2xl md:text-4xl font-black text-slate-900 mt-1">
             {currentBooks.length} <span className="text-[10px] md:text-sm text-slate-400 font-bold ml-0.5">{lang === 'BN' ? 'টি বই' : 'Books'}</span>
           </div>
        </div>

        {/* Card 2: Total Read Books */}
        <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left hover:scale-[1.02] transition-transform duration-300">
           <div className="flex items-center space-x-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50/70 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                 <History className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">
                {lang === 'BN' ? 'মোট পঠিত বই' : 'Total Read Books'}
              </span>
           </div>
           <div className="text-2xl md:text-4xl font-black text-slate-900 mt-1">
             {pastBooks.length} <span className="text-[10px] md:text-sm text-slate-400 font-bold ml-0.5">{lang === 'BN' ? 'টি বই' : 'Books'}</span>
           </div>
        </div>

        {/* Card 3: Total Store Orders */}
        <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left hover:scale-[1.02] transition-transform duration-300">
           <div className="flex items-center space-x-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50/70 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                 <Receipt className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">
                {lang === 'BN' ? 'মোট শপ অর্ডার' : 'Total Store Orders'}
              </span>
           </div>
           <div className="text-2xl md:text-4xl font-black text-slate-900 mt-1">
             {orders.length} <span className="text-[10px] md:text-sm text-slate-400 font-bold ml-0.5">{lang === 'BN' ? 'টি অর্ডার' : 'Orders'}</span>
           </div>
        </div>

        {/* Card 4: Outstanding Dues */}
        <div className="bg-[#0b1329] p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-lg shadow-indigo-150 relative overflow-hidden group text-left hover:scale-[1.02] transition-transform duration-350">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 text-indigo-300 rounded-xl flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-wider leading-tight">
                    {lang === 'BN' ? 'বকেয়া পরিমাণ' : 'Outstanding Dues'}
                  </span>
              </div>
               <div className="text-2.5xl md:text-4xl font-black text-white mt-1">
                 ৳ {user.dues ?? 0}
               </div>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (() => {
                  const currentList = activeTab === 'current' ? currentBooks : pastBooks;
                  const isCurrent = activeTab === 'current';
                  
                  // Calculate dynamic sum of current late fees
                  const activeOverdueIssues = isCurrent ? currentList.filter(i => {
                    const rem = getDaysRemainingValue(i.dueDate);
                    return i.status === 'Overdue' || (i.status === 'Active' && rem < 0);
                  }) : [];
                  
                  const sumOfFines = activeOverdueIssues.reduce((sum, i) => {
                    if (i.fineWaived) return sum;
                    if (i.customFineAmount !== undefined && i.customFineAmount !== null) {
                      return sum + i.customFineAmount;
                    }
                    const rem = getDaysRemainingValue(i.dueDate);
                    return sum + (Math.abs(rem) * 5);
                  }, 0);

                  if (currentList.length === 0) {
                    return (
                      <div className="py-20 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookIcon className="w-10 h-10 text-slate-200" />
                         </div>
                         <p className="text-slate-400 font-bold">
                           {lang === 'BN' ? 'কোনো লোন বা ধারের রেকর্ড পাওয়া যায়নি' : 'No book loan records found'}
                         </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Alert Card 1: Cumulative Overdue standing fees */}
                      {isCurrent && sumOfFines > 0 && (
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start space-x-3.5 shadow-sm">
                          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                          <div>
                            <h4 className="text-xs font-extrabold text-rose-800 leading-none">
                              {lang === 'BN' ? 'বিলম্ব জরিমানা বকেয়া রয়েছে!' : 'Overdue Late Fees Standing!'}
                            </h4>
                            <p className="text-[11px] font-bold text-rose-600 mt-2 leading-relaxed">
                              {lang === 'BN' 
                                ? `আপনার বই জমা দেওয়ার সময়সীমা অতিক্রম করায় বর্তমানে মোট ৳${toBengaliNumber(sumOfFines)} টাকা লেট ফি জমা হয়েছে। প্রতিদিন ৫ টাকা অতিরিক্ত হারে এই জরিমানা বাড়তে থাকে। অনুগ্রহ করে অতিসত্বর বিভাগে বই ফেরত প্রদান করতঃ জরিমানা পরিশোধ করুন।`
                                : `Due to overdue book submission, you have a cumulative late fee of ৳${sumOfFines} standing. Fees accumulate at ৳5/day. Please return the book and resolve dues.`
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Alert Card 2: Official waivers notifications */}
                      {isCurrent && currentList.some(i => i.fineWaived && i.waiverApologyMessage) && (
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start space-x-3.5 shadow-sm">
                          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="w-full">
                            <h4 className="text-xs font-extrabold text-emerald-800 leading-none">
                              {lang === 'BN' ? 'জরিমানা মওকুফ নোটিফিকেশন' : 'Late Fee Waiver Notifications'}
                            </h4>
                            <div className="space-y-1.5 mt-2.5">
                              {currentList.filter(i => i.fineWaived && i.waiverApologyMessage).map(i => (
                                <p key={i.id} className="text-[11px] font-bold text-emerald-700 leading-relaxed bg-white/75 px-3.5 py-2 rounded-xl border border-emerald-100/50">
                                  📢 <strong>{i.bookTitle}</strong>: {i.waiverApologyMessage}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentList.map((issue) => {
                          const remDays = getDaysRemainingValue(issue.dueDate);
                          const isBookOverdue = issue.status === 'Overdue' || (issue.status === 'Active' && remDays < 0);
                          const daysOverdueCount = isBookOverdue ? Math.abs(remDays) : 0;
                          
                          let fineDisplay = '';
                          let hasFine = false;
                          let isWaived = !!issue.fineWaived;
                          
                          if (isBookOverdue && daysOverdueCount > 0) {
                            hasFine = true;
                            if (issue.fineWaived) {
                              fineDisplay = lang === 'BN' 
                                ? `বিলম্ব জরিমানা: ৳${toBengaliNumber(daysOverdueCount * 5)} টাকা (কো-অর্ডিনেটর কর্তৃক সম্পূর্ণ মওকুফ)` 
                                : `Overdue Fine: ৳${daysOverdueCount * 5} (Fully Waived by Coordinator)`;
                            } else if (issue.customFineAmount !== undefined && issue.customFineAmount !== null) {
                              fineDisplay = lang === 'BN' 
                                ? `সমন্বয়কৃত জরিমানা: ৳${toBengaliNumber(issue.customFineAmount)} টাকা (${toBengaliNumber(daysOverdueCount)} দিন অতিবাহিত)` 
                                : `Customized Fine: ৳${issue.customFineAmount} (${daysOverdueCount} days past due)`;
                            } else {
                              fineDisplay = lang === 'BN' 
                                ? `মোট জরিমানা: ৳${toBengaliNumber(daysOverdueCount * 5)} টাকা (${toBengaliNumber(daysOverdueCount)} দিন বিলম্ব, ৫ টাকা/দিন)` 
                                : `Accrued Penalty: ৳${daysOverdueCount * 5} (${daysOverdueCount} days late, ৳5/day)`;
                            }
                          }

                          return (
                            <div key={issue.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:shadow-xl transition-all flex flex-col justify-between">
                              <div>
                                <h3 className="font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors text-base line-clamp-2">{issue.bookTitle}</h3>
                                
                                <div className="space-y-2.5 pt-4 border-t border-slate-100/60 text-xs text-left">
                                  <div className="flex justify-between font-bold">
                                    <span className="text-slate-400">
                                      {issue.status === 'Pending' ? 'আবেদনের তারিখ:' :
                                       issue.status === 'Approved' ? 'অনুমোদনের তারিখ:' : 'ইস্যু তারিখ:'}
                                    </span>
                                    <span className="text-slate-600">{issue.issueDate}</span>
                                  </div>
                                  
                                  {issue.status !== 'Pending' && issue.status !== 'Approved' && (
                                    <div className="flex justify-between font-bold">
                                      <span className="text-slate-400">{lang === 'BN' ? 'ফেরত তারিখ:' : 'Due Date:'}</span>
                                      <span className={`px-2 py-0.5 rounded-lg ${isBookOverdue ? 'bg-rose-50 text-rose-600 font-extrabold animate-pulse' : 'text-slate-600'}`}>
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

                                  {issue.status === 'Approved' && (
                                    <div className="p-3 bg-indigo-50/70 border border-indigo-150 rounded-2xl text-[10px] font-bold text-indigo-700 leading-relaxed mt-2 animate-pulse font-sans">
                                      🎉 অভিনন্দন! আপনার আবেদনটি মঞ্জুর হয়েছে। অনুগ্রহ করে নির্ধারিত সময়-সীমায় উপস্থিত হয়ে বইটি সরাসরি সংগ্রহ করুন।
                                    </div>
                                  )}

                                  {issue.status === 'Pending' && (
                                    <div className="p-3 bg-amber-50/70 border border-amber-150 rounded-2xl text-[10px] font-bold text-slate-500 leading-relaxed mt-2 italic">
                                      ⏳ আপনার আবেদনটি সফলভাবে জমা হয়েছে। কো-অর্ডিনেটর কর্তৃক পর্যালোচনার পর সংগ্রহের সময় ও দিন জানিয়ে দেওয়া হবে।
                                    </div>
                                  )}

                                  {/* Individual Fine/Fee customized display */}
                                  {hasFine && (
                                    <div className={cn(
                                      "p-3 rounded-2xl text-[11px] font-bold leading-normal mt-2.5 flex items-center gap-2 border",
                                      isWaived 
                                        ? "bg-emerald-50/40 border-emerald-100 text-emerald-700 pr-4"
                                        : "bg-red-50/40 border-red-100 text-rose-600 pr-4"
                                    )}>
                                      <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                        isWaived ? "bg-emerald-500" : "animate-ping bg-rose-500"
                                      )} />
                                      <div className="w-full">
                                        <p className="font-extrabold text-[11px] leading-tight">{fineDisplay}</p>
                                        {isWaived && issue.waiverApologyMessage && (
                                          <p className="text-[10px] text-emerald-800 font-bold mt-1 bg-white/70 p-2 rounded-xl overflow-hidden leading-normal">
                                            ✉️ {issue.waiverApologyMessage}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-4 mt-6 flex items-center justify-between border-t border-slate-100/60">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                  issue.status === 'Returned' ? 'bg-emerald-100 text-emerald-600' : 
                                  issue.status === 'Pending' ? 'bg-yellow-101 text-yellow-700 border border-yellow-200 animate-pulse' :
                                  issue.status === 'Approved' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' :
                                  issue.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                  isBookOverdue ? 'bg-rose-101 text-rose-600 border border-red-200' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                  {issue.status === 'Pending' ? 'আবেদন পেন্ডিং' :
                                   issue.status === 'Approved' ? 'অনুমোদিত (পিকআপ)' :
                                   issue.status === 'Rejected' ? 'বাতিল' :
                                   issue.status === 'Returned' ? 'ফেরত সম্পন্ন' : 
                                   isBookOverdue ? 'মেয়াদ উত্তীর্ণ' : 'চলতি লোন'}
                                </span>
                                {isBookOverdue && (
                                  <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Digital Member ID card download sideboard */}
        <div className="w-full space-y-6">
          {/* High-end Segmented Switcher for ID Card vs Library Card Info */}
          <div className="bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/60 shadow-sm flex items-center justify-between w-full no-print">
            <button
              onClick={() => setSidebarTab('id-card')}
              className={cn(
                "flex-1 py-3 px-2 text-center rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95",
                sidebarTab === 'id-card'
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/50"
              )}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>{lang === 'BN' ? 'আইডি কার্ড' : 'ID Card'}</span>
            </button>
            <button
              onClick={() => setSidebarTab('card-edit')}
              className={cn(
                "flex-1 py-3 px-2 text-center rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95",
                sidebarTab === 'card-edit'
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/50"
              )}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'BN' ? 'কার্ড সংশোধন' : 'Card Info'}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {sidebarTab === 'id-card' ? (
              <motion.div
                key="id-card-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {(user.status === 'accepted' || user.status === 'active') ? (
                  <IdCardDownloader member={user} />
                ) : (
                  <div className="bg-amber-50 border border-amber-100/60 p-8 rounded-[32px] text-left text-slate-700 space-y-4">
                    <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      আইডি কার্ড তৈরি হচ্ছে…
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-550 font-medium">
                      আপনার মেম্বারশিপ অ্যাকাউন্টটি সক্রিয় হলে এবং কো-অর্ডিনেটর কর্তৃক আপনার বার্ষিক চার্জ ও অনুমোদন সম্পন্ন হলে আপনার স্বয়ংক্রিয় লাইভ ডিজিটাল পরিচয়পত্র (ID Card) এখানে প্রদর্শিত হবে। কো-অর্ডিনেটর কর্তৃক অনুমোদন সম্পন্ন হওয়া পর্যন্ত দয়া করে অপেক্ষা করুন।
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="card-info-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-6"
              >
                {/* EDIT DETAILS CARD FORM */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-5 text-left">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-55">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                       <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {lang === 'BN' ? 'কার্ডের তথ্য সংশোধন' : 'Update Library Card Info'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {lang === 'BN' ? 'কম্পিউটারাইজড কার্ড ও সার্টিফিকেটের তথ্য দিন' : 'Edit academic details printed on your physical member card'}
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
                        {lang === 'BN' ? 'বিভাগের নাম (Department) (অপরিবর্তনশীল)' : 'Department Name (Permanent)'}
                      </label>
                      <div className="relative">
                        <Library className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 shrink-0 pointer-events-none" />
                        <input 
                          type="text"
                          readOnly
                          value={editDept || 'Department of Economics'}
                          className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-500 cursor-not-allowed focus:outline-none"
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
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/85 rounded-2xl text-xs font-bold text-slate-[850] focus:outline-none focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-600 transition-all"
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
                      <div className="p-3 border border-emerald-500/30 text-emerald-600 rounded-xl text-[10px] font-bold flex items-center space-x-2 animate-pulse mt-2 bg-emerald-50">
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

                {/* MEMBERSHIP SERVICES CARD */}
                {(user.status === 'accepted' || user.status === 'active') ? (
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-5 text-left">
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {lang === 'BN' ? 'মেম্বারশিপ ও কার্ড সার্ভিসেস' : 'Membership & Card Services'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {lang === 'BN' ? 'কার্ড নবায়ন এবং হারানো কার্ড রি-ইস্যু আবেদন করুন' : 'Apply for card renewal or lost card replacement'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">{lang === 'BN' ? 'মেয়াদ উত্তীর্ণের তারিখ:' : 'Expiry Date:'}</span>
                          <span className="text-slate-700">{user.paidUntilDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">{lang === 'BN' ? 'ফি পরিশোধের ধরন:' : 'Fee Status:'}</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.yearlyFeeStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {user.yearlyFeeStatus === 'paid' ? (lang === 'BN' ? 'পরিশোধিত' : 'বকেয়া') : (lang === 'BN' ? 'বকেয়া' : 'Unpaid')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Membership Renewal Request Action */}
                        {user.renewalStatus === 'requested' ? (
                          <div className="w-full text-center py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black">
                            ⏳ {lang === 'BN' ? 'মেম্বারশিপ নবায়ন আবেদন পেন্ডিং' : 'Renewal Request Pending...'}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestRenewal}
                            disabled={requestingRenewal}
                            className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2"
                          >
                            {requestingRenewal ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>{lang === 'BN' ? 'মেম্বারশিপ নবায়ন আবেদন' : 'Apply for Membership Renewal'}</span>
                          </button>
                        )}

                        {/* Lost Card Reissue Action */}
                        {user.lostCardStatus === 'requested' ? (
                          <div className="w-full text-center py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black">
                            ⏳ {lang === 'BN' ? 'কার্ড রি-ইস্যু আবেদন পেন্ডিং' : 'Card Reissue Pending...'}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestReissue}
                            disabled={requestingReissue}
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2"
                          >
                            {requestingReissue ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{lang === 'BN' ? 'হারানো কার্ড রি-ইস্যু আবেদন' : 'Apply for Lost Card Reissue'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
