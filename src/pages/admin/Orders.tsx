import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Package, ShoppingCart, Search, RefreshCw, 
  Loader2, CheckCircle2, ChevronRight, X,
  Eye, Truck, ExternalLink, Filter, User as UserIcon, Mail, Trash2, ShieldAlert,
  BookOpen, CheckSquare, Bookmark, ArrowRight, Calendar, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseOrder, SupabaseIssue, SupabaseBook } from '@/src/lib/supabaseDatabase';

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'shop'>('borrow');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [issues, setIssues] = useState<SupabaseIssue[]>([]);
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  // Selected Order for Edit/Detail modal
  const [selectedOrder, setSelectedOrder] = useState<SupabaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('Pending');

  // Selected Issue for Approve/Schedule modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingIssue, setApprovingIssue] = useState<SupabaseIssue | null>(null);
  const [approvePickupDate, setApprovePickupDate] = useState('');
  const [approveDueDate, setApproveDueDate] = useState('');

  const formatDateToSlash = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Search and filter state for Borrow requests
  const [borrowSearchTerm, setBorrowSearchTerm] = useState('');
  const [borrowStatusFilter, setBorrowStatusFilter] = useState<string>('Pending');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch Bookstore Orders
      const fetchedOrders = await db.getOrders();
      setOrders(fetchedOrders);
      setTableMissing(db.ordersTableMissing);

      // Fetch Book Borrowing Requests
      const fetchedIssues = await db.getIssues();
      setIssues(fetchedIssues);

      // Fetch Physical Books
      const fetchedBooks = await db.getBooks();
      setBooks(fetchedBooks.filter(b => !b.isEBook));
    } catch (err) {
      console.error('Error fetching admin orders / issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStatusModal = (order: SupabaseOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsModalOpen(true);
  };

  // Bookstore order update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const updatedOrder = {
        ...selectedOrder,
        status: newStatus
      };

      await db.saveOrder(updatedOrder);
      setIsModalOpen(false);
      
      // Simulate Email transmission
      if (newStatus !== selectedOrder.status) {
        let actionBn = 'গৃহীত হয়েছে';
        if (newStatus === 'Shipped') actionBn = 'শিপড (Shipped) করা হয়েছে';
        if (newStatus === 'Delivered') actionBn = 'ডেলিভারি সম্পন্ন হয়েছে';
        if (newStatus === 'Cancelled') actionBn = 'বাতিল করা হয়েছে';

        const mailMessage = `📩 ইমেল প্রেরিত: ${selectedOrder.customerEmail} ঠিকানায় বার্তা পাঠানো হয়েছে - "প্রিয় ${selectedOrder.customerName}, আপনার বুক শপ অর্ডার #${selectedOrder.id} সফলভাবে ${actionBn}।"`;
        setEmailStatusMessage(mailMessage);
        
        // Auto hide success email simulation toast after 8 seconds
        setTimeout(() => {
          setEmailStatusMessage(null);
        }, 8000);
      }

      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই অর্ডার রেকর্ডটি মুছে ফেলতে চান?')) {
      try {
        setLoading(true);
        await db.deleteOrder(id);
        await loadData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Borrow Approval Flow (Interop with Issues.tsx)
  const handleOpenApproveModal = (issue: SupabaseIssue) => {
    setApprovingIssue(issue);
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dateFormatted = `${futureDate.toLocaleDateString('bn-BD')} সকাল ১০:০০ টা - দুপুর ৩:০০ টার মধ্যে`;
    setApprovePickupDate(dateFormatted);
    
    const dueCalendarDate = new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const yyyy = dueCalendarDate.getFullYear();
    const mm = String(dueCalendarDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueCalendarDate.getDate()).padStart(2, '0');
    setApproveDueDate(`${yyyy}-${mm}-${dd}`);
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

      // Update issue status to Active and save
      const updatedIssue: SupabaseIssue = {
        ...approvingIssue,
        status: 'Active',
        pickupDate: approvePickupDate,
        dueDate: formatDateToSlash(approveDueDate) || approvingIssue.dueDate,
        issueDate: new Date().toLocaleDateString('bn-BD')
      };
      
      await db.saveIssue(updatedIssue);
      try {
        await db.addAuditLog('APPROVE_BORROW_REQUEST', `ধারের আবেদন অনুমোদিত: ${approvingIssue.bookTitle} -> সদস্য: ${approvingIssue.memberName}`);
      } catch (_) {}
      
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

  const handleRejectBorrowRequest = async (issue: SupabaseIssue) => {
    if (!window.confirm(`আপনি কি সত্যিই "${issue.bookTitle}" বইটির ধারের আবেদন বাতিল করতে চান?`)) {
      return;
    }
    try {
      setLoading(true);
      const updatedIssue: SupabaseIssue = {
        ...issue,
        status: 'Rejected'
      };
      await db.saveIssue(updatedIssue);
      try {
        await db.addAuditLog('REJECT_BORROW_REQUEST', `ধারের আবেদন বাতিল/নাকচ: ${issue.bookTitle} -> সদস্য: ${issue.memberName}`);
      } catch (_) {}
      alert('আবেদনটি বাতিল ও প্রত্যাখ্যাত করা হয়েছে।');
      await loadData();
    } catch (err) {
      console.error('Rejecting request failed:', err);
      alert('আবেদন বাতিলে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Filter lists
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const filteredIssues = issues.filter(i => {
    const matchesSearch = 
      i.bookTitle.toLowerCase().includes(borrowSearchTerm.toLowerCase()) ||
      i.memberName.toLowerCase().includes(borrowSearchTerm.toLowerCase());
    
    if (borrowStatusFilter === 'All') return matchesSearch;
    return matchesSearch && i.status === borrowStatusFilter;
  });

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const pendingBorrowsCount = issues.filter(i => i.status === 'Pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Real-time Simulated Email Alert Toast */}
      {emailStatusMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-slate-900 border border-indigo-500 text-indigo-400 p-6 rounded-[24px] shadow-2xl flex items-start gap-4 text-left max-w-2xl mx-auto"
        >
          <Mail className="w-8 h-8 shrink-0 text-indigo-400 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-black text-sm text-white">স্বয়ংক্রিয় ইমেইল নোটিফিকেশন প্রেরিত!</h4>
            <p className="text-xs font-bold font-mono text-slate-300 mt-1">{emailStatusMessage}</p>
          </div>
          <button onClick={() => setEmailStatusMessage(null)} className="text-slate-400 hover:text-white p-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="text-left">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই ধার ও শপ অর্ডার অনুরোধ (Borrow & Order Request List)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সদস্যদের বই ধার নেওয়ার আবেদন ও ক্যাটালগ শপের বই অর্ডারসমূহের স্ট্যাটাস ট্র্যাক ও অনুমোদন করুন</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[28px] border border-slate-100">
          <div className="px-6 py-3 bg-white rounded-2xl shadow-sm hover:scale-105 transition-transform text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">অপেক্ষমান ধার</span>
            <span className="text-xl font-black text-amber-600">{pendingBorrowsCount} টি</span>
          </div>
          <div className="px-6 py-3 bg-rose-50 rounded-2xl shadow-sm text-rose-600 hover:scale-105 transition-transform text-left">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">অপেক্ষমান শপ</span>
            <span className="text-xl font-black text-rose-600">{pendingOrdersCount} টি</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector for Borrow Requests vs Bookstore Orders */}
      <div className="flex border border-slate-200 p-1 bg-white rounded-3xl max-w-lg mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('borrow')}
          className={cn(
            "flex-grow py-3.5 px-6 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2",
            activeTab === 'borrow' 
              ? "bg-indigo-650 text-white shadow-xl shadow-indigo-600/10" 
              : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>বই ধার অনুরোধ তালিকা ({issues.filter(i => i.status === 'Pending').length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('shop')}
          className={cn(
            "flex-grow py-3.5 px-6 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2",
            activeTab === 'shop' 
              ? "bg-indigo-650 text-white shadow-xl shadow-indigo-600/10" 
              : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>শপ অর্ডার তালিকা ({orders.filter(o => o.status === 'Pending').length})</span>
        </button>
      </div>

      {/* TAB 1: Book Borrowing Requests */}
      {activeTab === 'borrow' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden text-left animate-in fade-in duration-300">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="সদস্যের নাম বা বইয়ের নাম খুঁজুন..." 
                value={borrowSearchTerm}
                onChange={(e) => setBorrowSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black text-slate-400">অবস্থা:</span>
              {['All', 'Pending', 'Active', 'Returned', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setBorrowStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 text-xs font-black rounded-xl border transition-all",
                    borrowStatusFilter === status 
                      ? "bg-slate-950 text-white border-slate-950" 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {status === 'All' ? 'সব' : status === 'Pending' ? 'পেন্ডিং' : status === 'Active' ? 'সক্রিয় লোন' : status === 'Returned' ? 'ফেরতপ্রাপ্ত' : 'প্রত্যাখ্যাত'}
                </button>
              ))}
            </div>
          </div>

          {loading && issues.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-505 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-5">বই বিবরণী</th>
                    <th className="px-8 py-5">সদস্য</th>
                    <th className="px-8 py-5">আবেদনের তারিখ</th>
                    <th className="px-8 py-5">ফেরত / সংগ্রহের শিডিউল</th>
                    <th className="px-8 py-5">স্ট্যাটাস</th>
                    <th className="px-8 py-5 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div>
                            <span className="font-black text-slate-900 line-clamp-1">{issue.bookTitle}</span>
                            {issue.notes && (
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5 line-clamp-1 italic">নোট: {issue.notes}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <span className="font-extrabold text-slate-900 block">{issue.memberName}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">আইডি / মেইল</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-bold">{issue.issueDate}</td>
                      <td className="px-8 py-6">
                        {issue.status === 'Pending' ? (
                          <span className="text-yellow-600 font-black text-xs">এডমিন নির্ধারণ করবে</span>
                        ) : (
                          <div className="flex flex-col text-left">
                            <span className="text-slate-800 font-bold">সীমা: {issue.dueDate}</span>
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
                           issue.status === 'Pending' ? 'পেন্ডিং' :
                           issue.status === 'Returned' ? 'ফেরতপ্রাপ্ত' : 'বাতিল / প্রত্যাখ্যাত'}
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
                        <p className="font-bold text-slate-500">বর্তমানে কোন ধার নেওয়ার আবেদন রেকর্ড পাওয়া যায়নি।</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Bookstore Shop Orders */}
      {activeTab === 'shop' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden text-left animate-in fade-in duration-300">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="অর্ডার আইডি, বই বা সদস্যের নাম..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black text-slate-400">অবস্থা:</span>
              {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 text-xs font-black rounded-xl border transition-all",
                    statusFilter === status 
                      ? "bg-slate-950 text-white border-slate-950" 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {status === 'All' ? 'সব' : status === 'Pending' ? 'পেন্ডিং' : status === 'Shipped' ? 'শিপিং' : status === 'Delivered' ? 'ডেলিভার্ড' : 'বাতিল'}
                </button>
              ))}
            </div>
          </div>

          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-505 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-5">অর্ডার (Order ID)</th>
                    <th className="px-8 py-5">গ্রাহক বিবরণী</th>
                    <th className="px-8 py-5">বইসমূহ</th>
                    <th className="px-8 py-5">শিপিং ঠিকানা</th>
                    <th className="px-8 py-5">সর্বমোট মূল্য</th>
                    <th className="px-8 py-5">স্ট্যাটাস</th>
                    <th className="px-8 py-5 text-right">সম্পাদন / মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-indigo-500 shrink-0" />
                          <span className="font-mono font-black text-slate-900 uppercase">#{order.id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <Link 
                            to={`/admin/users?search=${encodeURIComponent(order.customerName)}`}
                            className="font-black text-slate-900 hover:text-indigo-600 transition-colors block"
                          >
                            {order.customerName}
                          </Link>
                          <span className="text-xs text-slate-400 font-bold block">{order.customerEmail}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-extrabold text-slate-700 line-clamp-1">{order.items}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{order.date}</p>
                      </td>
                      <td className="px-8 py-6 leading-relaxed">
                        <p className="text-slate-500 font-bold max-w-xs truncate">{order.address || 'ক্যাম্পাস রুম / বিভাগ'}</p>
                        <span className="text-xs font-mono font-bold text-indigo-500">{order.customerPhone}</span>
                      </td>
                      <td className="px-8 py-6 text-emerald-600 font-bold text-lg">৳ {order.total}</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                          order.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          order.status === 'Shipped' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          order.status === 'Delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {order.status === 'Pending' ? 'পেন্ডিং' : 
                           order.status === 'Shipped' ? 'গৃহীত (Shipped)' : 
                           order.status === 'Delivered' ? 'ডেলিভার্ড' : 'বাতিল'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => openStatusModal(order)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black"
                            title="স্ট্যাটাস পরিবর্তন করুন"
                          >
                            স্ট্যাটাস পরিবর্তন
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                            title="অর্ডার রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center text-slate-400">
                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-500">বর্তমানে কোন শপ অর্ডার রেকর্ড পাওয়া যায়নি।</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Order Status Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 font-sans">
              <h3 className="text-xl font-black text-slate-900">অর্ডার স্ট্যাটাস আপডেট করুন</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-6 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2">
                <p className="font-bold text-slate-500">অর্ডার আইডি: <strong className="text-slate-900">#{selectedOrder.id}</strong></p>
                <p className="font-bold text-slate-500">গ্রাহক: <strong className="text-slate-900">{selectedOrder.customerName}</strong></p>
                <p className="font-bold text-slate-500">বইসমূহ: <strong className="text-slate-900">{selectedOrder.items}</strong></p>
                <p className="font-bold text-slate-500">মোট মূল্য: <strong className="text-indigo-600">৳ {selectedOrder.total}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">নতুন স্ট্যাটাস নির্ধারণ করুন</label>
                <div className="space-y-2">
                  {[
                    { val: 'Pending', label: 'পেন্ডিং (অপেক্ষা করুন)' },
                    { val: 'Shipped', label: 'গৃহীত করুন ও শিপ করুন (Accept / Shipped)' },
                    { val: 'Delivered', label: 'ডেলিভার সম্পন্ন (Delivered)' },
                    { val: 'Cancelled', label: 'অর্ডার বাতিল করুন (Cancelled)' }
                  ].map((st) => (
                    <label key={st.val} className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                      newStatus === st.val ? "bg-indigo-50 border-indigo-600 text-indigo-900" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    )}>
                      <input 
                        type="radio" 
                        name="statusGroup"
                        value={st.val}
                        checked={newStatus === st.val}
                        onChange={() => setNewStatus(st.val as any)}
                        className="accent-indigo-600 shrink-0"
                      />
                      <span className="text-sm font-black">{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-2.5 text-[10px] font-bold text-slate-400 leading-relaxed">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>স্ট্যাটাস পরিবর্তন করার পর গ্রাহকের ইমেইলে নোটিফিকেশন পৌঁছে যাবে এবং তাদের অ্যাকাউন্ট পেজে সচল পরিবর্তন দেখতে পাবেন।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl">বাতিল</button>
                <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100">আপডেট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve and Schedule Borrow Request Modal */}
      {isApproveModalOpen && approvingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[45px] border border-slate-100 p-8 md:p-10 shadow-2xl max-w-lg w-full text-left">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-indigo-600" />
                <span>আবেদন অনুমোদন ও সময় নির্ধারণ</span>
              </h3>
              <button 
                onClick={() => { setIsApproveModalOpen(false); setApprovingIssue(null); }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-905"
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
                <p className="text-[10px] text-slate-400 font-bold mt-1.5">💡 এই সংগ্রহের সময়টি সদস্য তার প্রোফাইলের "আমার বুক অর্ডার শপ" বা "বর্তমানের আবেদন" ট্যাব থেকে সরাসরি দেখতে পাবেন এবং নির্দিষ্ট সময়ে বই সংগ্রহ করতে হাজির হবেন।</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেরত দেওয়ার শেষ সময় (Due Date)</label>
                <input 
                  type="date"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 font-sans"
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
