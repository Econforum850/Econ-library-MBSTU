import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, 
  Search, Filter, RefreshCw, Loader2,
  BookOpen, User as UserIcon, ArrowRight,
  Plus, X, Calendar, CheckSquare, Bookmark, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseIssue as SheetIssue, SupabaseBook, SupabaseMember } from '@/src/lib/supabaseDatabase';

export default function AdminIssues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history'>('active');
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Modal / Form States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customBookTitle, setCustomBookTitle] = useState('');
  const [customMemberName, setCustomMemberName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  // Borrow Approval States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingIssue, setApprovingIssue] = useState<SheetIssue | null>(null);
  const [approvePickupDate, setApprovePickupDate] = useState('');
  const [approveDueDate, setApproveDueDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch Issues
      const fetchedIssues = await db.getIssues();
      setIssues(fetchedIssues);
      
      // Fetch Books & Members for Modal dropdowns
      const fetchedBooks = await db.getBooks();
      setBooks(fetchedBooks.filter(b => !b.isEBook)); // only physical books can be issued
      
      const fetchedMembers = await db.getMembers();
      setMembers(fetchedMembers.filter(m => m.status === 'accepted' || m.status === 'active'));

      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Issues data pre-load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set default dates
    setIssueDate(new Date().toLocaleDateString('bn-BD'));
    const dynamicDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setDueDate(dynamicDue.toLocaleDateString('bn-BD'));
  }, []);

  const handleOpenIssueModal = () => {
    setSelectedBookId('');
    setSelectedMemberId('');
    setCustomBookTitle('');
    setCustomMemberName('');
    setIssueDate(new Date().toLocaleDateString('bn-BD'));
    const dynamicDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setDueDate(dynamicDue.toLocaleDateString('bn-BD'));
    setIsIssueModalOpen(true);
  };

  const handleCreateIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine book title and member name
    let bookTitle = customBookTitle;
    let memberName = customMemberName;
    let targetBook: SupabaseBook | undefined;

    if (selectedBookId) {
      targetBook = books.find(b => b.id === selectedBookId);
      if (targetBook) {
        bookTitle = targetBook.title;
      }
    }

    if (selectedMemberId) {
      const targetMember = members.find(m => m.id === selectedMemberId);
      if (targetMember) {
        memberName = `${targetMember.name} (#${targetMember.id})`;
      }
    }

    if (!bookTitle || !memberName) {
      alert('দয়া করে বই এবং সদস্য নির্বাচন করুন অথবা নাম লিখুন!');
      return;
    }

    try {
      setIsSavingIssue(true);

      // Save issue in database
      const newIssue: Partial<SheetIssue> = {
        bookTitle,
        memberName,
        issueDate: issueDate || new Date().toLocaleDateString('bn-BD'),
        dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD'),
        status: 'Active'
      };

      await db.saveIssue(newIssue);

      // Interconnect: Automatically decrement the stock of the selected book
      if (targetBook && targetBook.stock > 0) {
        const updatedBook = {
          ...targetBook,
          stock: targetBook.stock - 1,
          status: (targetBook.stock - 1 === 0) ? 'pre-order' as const : 'available' as const
        };
        await db.saveBook(updatedBook);
      }

      alert('বইটি সফলভাবে ইস্যু করা হয়েছে এবং বইয়ের স্টক আপডেট করা হয়েছে!');
      setIsIssueModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error creating issue loan:', err);
      alert('বই ইস্যু সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleReturnIssue = async (issue: SheetIssue) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${issue.bookTitle}" বইটি ফেরত নিতে চান?`)) {
      return;
    }

    try {
      setLoading(true);
      // Mark issue as Returned
      const updatedIssue: SheetIssue = {
        ...issue,
        status: 'Returned'
      };
      await db.saveIssue(updatedIssue);

      // Interconnect: Automatically increment stock of the book if found by title
      const matchedBook = books.find(b => b.title.toLowerCase() === issue.bookTitle.toLowerCase() || b.id === issue.bookId);
      if (matchedBook) {
        const updatedBook = {
          ...matchedBook,
          stock: (matchedBook.stock || 0) + 1,
          status: 'available' as const
        };
        await db.saveBook(updatedBook);
      }

      alert('বইটি ফেরত নেওয়া হয়েছে এবং ষ্টক রেজিস্ট্রি আপডেট করা হয়েছে!');
      await loadData();
    } catch (err) {
      console.error('Error returning book issue:', err);
      alert('বই ফেরত সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveModal = (issue: SheetIssue) => {
    setApprovingIssue(issue);
    // Suggest 3 days later for collection by default
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dateFormatted = `${futureDate.toLocaleDateString('bn-BD')} সকাল ১০:০০ টা - দুপুর ৩:০০ টার মধ্যে`;
    setApprovePickupDate(dateFormatted);
    
    // Set typical due date (14 days from collection)
    const dueFormatted = new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD');
    setApproveDueDate(dueFormatted);
    setIsApproveModalOpen(true);
  };

  const handleApproveBorrowRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingIssue) return;
    try {
      setLoading(true);
      
      const matchedBook = books.find(b => b.title.toLowerCase() === approvingIssue.bookTitle.toLowerCase() || b.id === approvingIssue.bookId);

      // Decrement book stock if available
      if (matchedBook) {
        if (matchedBook.stock <= 0) {
          alert('দুঃখিত, এই বইয়ের কোন স্টক ফাঁকা নেই!');
          return;
        }
        const updatedBook = {
          ...matchedBook,
          stock: Math.max(0, matchedBook.stock - 1),
          status: (matchedBook.stock - 1 <= 0) ? 'pre-order' as const : 'available' as const
        };
        await db.saveBook(updatedBook);
      }

      // Update issue loan parameters
      const updatedIssue: SheetIssue = {
        ...approvingIssue,
        status: 'Active',
        pickupDate: approvePickupDate,
        dueDate: approveDueDate || approvingIssue.dueDate,
        issueDate: new Date().toLocaleDateString('bn-BD')
      };
      
      await db.saveIssue(updatedIssue);
      alert('ধার নেওয়ার আবেদনটি সফলভাবে অনুমোদিত হয়েছে এবং সংগ্রহের সময় নির্ধারণ করা হয়েছে!');
      setIsApproveModalOpen(false);
      setApprovingIssue(null);
      await loadData();
    } catch (err) {
      console.error('Approving borrow request failed:', err);
      alert('আবেদন অনুমোদনে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBorrowRequest = async (issue: SheetIssue) => {
    if (!window.confirm(`আপনি কি সত্যিই "${issue.bookTitle}" বইটির ধারের আবেদন বাতিল করতে চান?`)) {
      return;
    }
    try {
      setLoading(true);
      const updatedIssue: SheetIssue = {
        ...issue,
        status: 'Rejected'
      };
      await db.saveIssue(updatedIssue);
      alert('আবেদনটি বাতিল ও প্রত্যাখ্যাত করা হয়েছে।');
      await loadData();
    } catch (err) {
      console.error('Rejecting request failed:', err);
      alert('আবেদন বাতিলে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Status-based Tab filtering
  const tabFilteredIssues = issues.filter(i => {
    if (activeTab === 'active') {
      return i.status === 'Active' || i.status === 'Overdue';
    }
    if (activeTab === 'pending') {
      return i.status === 'Pending';
    }
    return i.status === 'Returned' || i.status === 'Rejected';
  });

  const filteredIssues = tabFilteredIssues.filter(i => 
    i.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Supabase Integration SQL Guide panel */}
      <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden border border-slate-850">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-full uppercase tracking-wider">সুপাবেজ রিয়েলটাইম নির্দেশনা</span>
            <h3 className="text-2xl font-black mt-3 leading-tight">নতুন আবেদনসমূহ এবং সংগ্রহ সময়সমূহ এডমিন প্যানেলে শো করছে না?</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-xl font-bold">
              সদস্যদের বই সংগ্রহের সময়সূচী এবং লাইভ বুক রিকোয়েস্ট দেখতে আপনার সুপাবেজ ডাটাবেজে নতুন টেবিল কালেকশন এবং RLS পলিসি সেট করা আবশ্যিক। নিচে ক্লিক করে ১-ক্লিকে কপি কোড পেয়ে যান।
            </p>
          </div>
          <button 
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="flex items-center space-x-3 px-6 py-3.5 bg-indigo-600 hover:bg-slate-800 transition-all text-[11px] font-black rounded-2xl shrink-0"
          >
            <span>{showSqlGuide ? 'নির্দেশিকা বন্ধ করুন' : 'টেবিল তৈরীর SQL কোড দেখুন'}</span>
          </button>
        </div>

        {showSqlGuide && (
          <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-left">
            <p className="text-slate-300 font-extrabold mb-4">💡 এটি কীভাবে করবেন:</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 mb-6 font-semibold">
              <li>আপনার <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Supabase Dashboard</a> এ প্রবেশ করে আপনার প্রজেক্টে ক্লিক করুন।</li>
              <li>বামদিকের মেনু থেকে <strong className="text-slate-200">"SQL Editor"</strong> এ ক্লিক করুন এবং <strong className="text-slate-200">"New Query"</strong> খুলুন।</li>
              <li>নিচের সম্পূর্ণ কোডটি কপি করে পেস্ট করুন এবং ডানদিকের <strong className="text-slate-200">"Run"</strong> বাটনে ক্লিক করুন:</li>
            </ol>
            <div className="relative">
              <pre className="bg-slate-950 p-6 rounded-2xl overflow-x-auto text-indigo-300 font-mono text-[11px] leading-relaxed max-h-56 no-scrollbar border border-slate-800 selection:bg-indigo-500 selection:text-white">
{`-- ১. বই লোন / ইস্যু টেবিল স্কিমা (Issues Table Schema)
CREATE TABLE IF NOT EXISTS issues (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  book_title text NOT NULL,
  member_name text NOT NULL,
  issue_date text NOT NULL,
  due_date text NOT NULL,
  status text DEFAULT 'Active',
  member_id text,
  book_id text,
  pickup_date text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ২. বই বিক্রয় অর্ডার টেবিল স্কিমা (Orders Table Schema)
CREATE TABLE IF NOT EXISTS orders (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  member_id text,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  address text,
  date text,
  total numeric DEFAULT 0,
  items text,
  status text DEFAULT 'Pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. সিকিউরিটি পলিসি নিষ্ক্রিয়করণ (Disable RLS for Direct Query)
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS issues (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  book_title text NOT NULL,
  member_name text NOT NULL,
  issue_date text NOT NULL,
  due_date text NOT NULL,
  status text DEFAULT 'Active',
  member_id text,
  book_id text,
  pickup_date text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  member_id text,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  address text,
  date text,
  total numeric DEFAULT 0,
  items text,
  status text DEFAULT 'Pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`);
                  alert('সম্পূর্ণ SQL স্ক্রিপ্ট কপি হয়েছে!');
                }}
                className="absolute top-4 right-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg"
              >
                কোড কপি করুন
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই ইস্যু ও ফেরত (Issues)</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {issues.length} টি রেকর্ড সংরক্ষিত</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ ডেটাবেইজ
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleOpenIssueModal}
            className="flex items-center space-x-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <span>নতুন বই ইস্যু করুন</span>
          </button>
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs Filter Section */}
      <div className="flex border-b border-slate-100 max-w-md bg-slate-50 p-1.5 rounded-[22px] border">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all",
            activeTab === 'active' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          সক্রিয় লোন ({issues.filter(i => i.status === 'Active' || i.status === 'Overdue').length})
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all relative",
            activeTab === 'pending' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          আবেদনসমূহ ({issues.filter(i => i.status === 'Pending').length})
          {issues.filter(i => i.status === 'Pending').length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all",
            activeTab === 'history' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          ইতিহাস রেকর্ড ({issues.filter(i => i.status === 'Returned' || i.status === 'Rejected').length})
        </button>
      </div>

      {loading && issues.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="relative w-full md:w-96 mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="বই বা সদস্যের নাম খুঁজুন..." 
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
                  <th className="px-8 py-5">বই (Book)</th>
                  <th className="px-8 py-5">সদস্য (Member)</th>
                  <th className="px-8 py-5">ইস্যু / আবেদনের তারিখ</th>
                  <th className="px-8 py-5">ফেরত / সংগ্রহের সময়</th>
                  <th className="px-8 py-5">স্ট্যাটাস</th>
                  <th className="px-8 py-5 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="font-black text-slate-900 line-clamp-1">{issue.bookTitle}</span>
                          {issue.notes && (
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5 line-clamp-1 italic">নোট: {issue.notes}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Link 
                        to={`/admin/users?search=${encodeURIComponent(issue.memberName.split(' ')[0])}`}
                        className="flex items-center space-x-3 group/link hover:text-indigo-600 transition-colors"
                      >
                        <UserIcon className="w-5 h-5 text-slate-400 group-hover/link:text-indigo-400" />
                        <span className="font-bold text-slate-600 group-hover/link:text-indigo-600">{issue.memberName}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-indigo-400" />
                      </Link>
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-bold">
                      {issue.issueDate}
                    </td>
                    <td className="px-8 py-6">
                      {issue.status === 'Pending' ? (
                        <span className="text-yellow-600 font-black text-xs">এডমিন নির্ধারণ করবে</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{issue.dueDate}</span>
                          {issue.pickupDate && (
                            <span className="text-[10px] text-indigo-600 font-black tracking-tight mt-0.5">সংগ্রহ: {issue.pickupDate}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                        issue.status === 'Active' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        issue.status === 'Pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        issue.status === 'Returned' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        {issue.status === 'Active' ? 'চলতি লোন' : 
                         issue.status === 'Pending' ? 'আবেদন পেন্ডিং' :
                         issue.status === 'Returned' ? 'ফেরত প্রাপ্ত' : 'বাতিল / প্রত্যাখ্যাত'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {issue.status === 'Pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenApproveModal(issue)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 duration-150"
                          >
                            অনুমোদন ও শিডিউল
                          </button>
                          <button 
                            onClick={() => handleRejectBorrowRequest(issue)}
                            className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : issue.status === 'Active' || issue.status === 'Overdue' ? (
                        <button 
                          onClick={() => handleReturnIssue(issue)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                        >
                          ফেরত নিন
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">নিষ্পত্তি সম্পূর্ণ</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                      <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-bold">এই ক্যাটাগরিতে কোন ইস্যু লোন বা আবেদন ডাটা পাওয়া যায়নি।</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Issue Loan Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">নতুন বই ইস্যু বা ধার দিন</h3>
              <button 
                onClick={() => setIsIssueModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-6 text-left">
              
              {/* Select book */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">লাইব্রেরি বই নির্বাচন করুন</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    if (e.target.value === '') setCustomBookTitle('');
                  }}
                >
                  <option value="">-- বই সিলেক্ট করুন --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                      {b.title} (ID: {b.bookId}) - ষ্টক: {b.stock} কপি {b.stock <= 0 ? '[ষ্টক শেষ]' : ''}
                    </option>
                  ))}
                </select>
                
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">অথবা বইয়ের নাম লিখুন</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <input 
                  type="text"
                  placeholder="বইয়ের নাম (সিলেক্ট না করলে কার্যকর)"
                  disabled={!!selectedBookId}
                  className="mt-3 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                  value={customBookTitle}
                  onChange={(e) => setCustomBookTitle(e.target.value)}
                />
              </div>

              {/* Select Member */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">সক্রিয় সদস্য নির্বাচন করুন</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (e.target.value === '') setCustomMemberName('');
                  }}
                >
                  <option value="">-- সক্রিয় সদস্য সিলেক্ট করুন --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: {m.id})
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">অথবা সদস্যের নাম লিখুন</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <input 
                  type="text"
                  placeholder="সদস্যের নাম (সিলেক্ট না করলে কার্যকর)"
                  disabled={!!selectedMemberId}
                  className="mt-3 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                  value={customMemberName}
                  onChange={(e) => setCustomMemberName(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ইস্যু তারিখ</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেরতের শেষ সময়</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3 text-[10px] font-semibold text-slate-400 leading-relaxed">
                <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>বই লোন ইস্যু জমা করলে লাইব্রেরির বইয়ের ষ্টক রেজিস্ট্রি থেকে অটোজেনারেটেড ১টি কপি কমে যাবে। সদস্যের বিবরণী থেকে লোনের হিসাব পর্যবেক্ষণ করা সম্ভব হবে।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl"
                  disabled={isSavingIssue}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  disabled={isSavingIssue}
                >
                  {isSavingIssue ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ইস্যু হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ইস্যু কনফার্ম করুন</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Approve and Schedule Borrow Request Modal */}
      {isApproveModalOpen && approvingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[45px] border border-slate-100 p-8 md:p-10 shadow-2xl max-w-lg w-full text-left">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-indigo-600" />
                <span>আবেদন অনুমোদন ও সময় নির্ধারণ</span>
              </h3>
              <button 
                onClick={() => { setIsApproveModalOpen(false); setApprovingIssue(null); }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveBorrowRequest} className="space-y-6">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-bold text-slate-600">
                <p className="text-indigo-900 text-sm mb-1 font-black">বই নাম: {approvingIssue.bookTitle}</p>
                <p>আবেদনকারী: {approvingIssue.memberName}</p>
                {approvingIssue.notes && <p className="mt-2 text-[10px] italic text-slate-400">মন্তব্য: {approvingIssue.notes}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">বই সংগ্রহের নির্দিষ্ট তারিখ ও সময়</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: ০৫ জুন, ২০২৬ দুপুর ১২:০০ টা বা আমাদের অফিস সময়ে"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={approvePickupDate}
                  onChange={(e) => setApprovePickupDate(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 font-bold mt-1.5">💡 এই সংগ্রহের সময়টি সদস্য তার প্রোফাইলের "বর্তমানের আবেদন" ট্যাব থেকে সরাসরি দেখতে পাবেন এবং মোবাইলে জিপিএস ট্র্যাকিং বা নির্দিষ্ট সময়ে বই সংগ্রহ করতে উপস্থিত হবেন।</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেরত দেওয়ার শেষ সময় (Due Date)</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={approveDueDate}
                  onChange={(e) => setApproveDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsApproveModalOpen(false); setApprovingIssue(null); }}
                  className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl"
                >
                  ক্যান্সেল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-slate-900 transition-all"
                >
                  অনুমোদন দিন ও স্টক কমান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
