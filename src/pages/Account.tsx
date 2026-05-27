import { TrendingUp, TrendingDown, Wallet, User as UserIcon, Phone, MapPin, AtSign, Book as BookIcon, History, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, SupabaseMember as SheetMember, SupabaseIssue as SheetIssue } from '@/src/lib/supabaseDatabase';
import { cn } from '@/src/lib/utils';

export default function Account() {
  const [user, setUser] = useState<SheetMember | null>(null);
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const navigate = useNavigate();

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
        const queryIssues = await db.getIssues();
        const userIssues = queryIssues.filter(i => 
          i.memberName.toLowerCase().includes(parsedUser.name.toLowerCase()) ||
          (parsedUser.id && i.memberName.toLowerCase().includes(String(parsedUser.id).toLowerCase()))
        );
        setIssues(userIssues);
      } catch (err) {
        console.error('Failed to load user issues:', err);
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

  const currentBooks = issues.filter(i => i.status !== 'Returned');
  const pastBooks = issues.filter(i => i.status === 'Returned');

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
              "absolute -bottom-2 -right-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
              user.status === 'accepted' || user.status === 'active' ? "bg-emerald-500 text-white" : 
              user.status === 'pending' ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
            )}>
              {user.status === 'accepted' ? 'সক্রিয়' : user.status === 'pending' ? 'পেন্ডিং' : user.status === 'rejected' ? 'বাতিল' : user.status}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">{user.name}</h1>
                <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">Member ID: {user.id}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-rose-100 transition-all self-center md:self-start"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">{user.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <AtSign className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">{user.occupation || 'Member'}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold truncate">{user.address || 'Address not set'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <BookIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বর্তমানে কাছে আছে</span>
           </div>
           <div className="text-4xl font-black text-slate-900">{currentBooks.length} টি</div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                 <History className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট পড়া বই</span>
           </div>
           <div className="text-4xl font-black text-slate-900">{issues.length} টি</div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-indigo-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 text-indigo-300 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">বকেয়া পরিমাণ</span>
              </div>
              <div className="text-4xl font-black text-white">৳ {user.dues}</div>
           </div>
        </div>
      </div>

      {/* Books List Section */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center space-x-8">
           <button 
            onClick={() => setActiveTab('current')}
            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${activeTab === 'current' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}
           >
             বইয়ের তথ্য ({currentBooks.length})
           </button>
           <button 
            onClick={() => setActiveTab('history')}
            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${activeTab === 'history' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}
           >
             পুরানো রেকর্ড ({pastBooks.length})
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
              {(activeTab === 'current' ? currentBooks : pastBooks).length === 0 ? (
                <div className="py-20 text-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookIcon className="w-10 h-10 text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-bold">কোনো রেকর্ড পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTab === 'current' ? currentBooks : pastBooks).map((issue) => (
                    <div key={issue.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:shadow-xl transition-all">
                       <h3 className="font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">{issue.bookTitle}</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">ইস্যু তারিখ:</span>
                            <span className="text-slate-600">{issue.issueDate}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">ফেরত তারিখ:</span>
                            <span className={`px-2 py-0.5 rounded-lg ${issue.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 'text-slate-600'}`}>
                                {issue.dueDate}
                            </span>
                          </div>
                          <div className="pt-4 flex items-center justify-between">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                               issue.status === 'Returned' ? 'bg-emerald-100 text-emerald-600' : 
                               issue.status === 'Overdue' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                             }`}>
                               {issue.status}
                             </span>
                             {issue.status === 'Overdue' && (
                                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
