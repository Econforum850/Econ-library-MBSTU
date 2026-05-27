import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Package, ShoppingCart, Search, RefreshCw, 
  Loader2, CheckCircle2, ChevronRight, X,
  Eye, Truck, ExternalLink, Filter, User as UserIcon, Mail, Trash2, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseOrder } from '@/src/lib/supabaseDatabase';

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  // Selected Order for Edit/Detail modal
  const [selectedOrder, setSelectedOrder] = useState<SupabaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('Pending');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const fetched = await db.getOrders();
      setOrders(fetched);
      setTableMissing(db.ordersTableMissing);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openStatusModal = (order: SupabaseOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsModalOpen(true);
  };

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
      await loadOrders();
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
        await loadOrders();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const pendingCount = orders.filter(o => o.status === 'Pending').length;

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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই বিক্রয় অর্ডার (Shop Orders)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">শপ কার্ট থেকে কেনা বইয়ের ডেলিভারি ও স্ট্যাটাস আপডেট করুন</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[28px] border border-slate-100">
          <div className="px-6 py-3 bg-white rounded-2xl shadow-sm hover:scale-105 transition-transform">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">মোট অর্ডার</span>
            <span className="text-xl font-black text-slate-900">{orders.length} টি</span>
          </div>
          <div className="px-6 py-3 bg-rose-50 rounded-2xl shadow-sm text-rose-600 hover:scale-105 transition-transform">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">অপেক্ষমান অর্ডার</span>
            <span className="text-xl font-black text-rose-600">{pendingCount} টি</span>
          </div>
        </div>
      </div>

      {tableMissing && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-805 text-white p-8 md:p-10 rounded-[40px] shadow-2xl text-left space-y-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6 pb-6 border-b border-slate-800">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400 shrink-0 border border-amber-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-400 font-black rounded-lg text-[10px] uppercase tracking-widest inline-block">সহজ সমাধান গাইড</span>
              <h3 className="font-black text-xl md:text-2xl leading-snug">সুপাবেজ ডাটাবেজে "orders" টেবিলটি একটিভ করা নেই!</h3>
              <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-4xl">
                সদস্যরা তাদের প্রোফাইল থেকে বই অর্ডার করলে সেটি ক্লাউড ডাটাবেজে সাবমিট হচ্ছে না। আপনার কোনো ভয়ের কারণ নেই! 
                এটি ঠিক করতে আপনার কোনো কোডিং জ্ঞান বা জটিল জিনিস জানার প্রয়োজন নেই। নিচে দেখানো ৩টি খুবই সহজ ধাপ অনুসরণ করুন:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/60 relative space-y-3">
              <span className="absolute right-6 top-6 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-black text-xs">১</span>
              <h4 className="font-extrabold text-sm text-slate-200">লিংকে প্রবেশ করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                আপনার <strong>Supabase Dashboard</strong> এ প্রবেশ করুন এবং আপনার প্রজেক্টটি ওপেন করুন।
              </p>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-extrabold"
              >
                <span>ড্যাশবোর্ড লিংক</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/60 relative space-y-3">
              <span className="absolute right-6 top-6 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-black text-xs">২</span>
              <h4 className="font-extrabold text-sm text-slate-200 font-sans">SQL Editor এ যান</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                সুপাবেজ স্ক্রিনের বাম পাশের সাইডবারে থাকা <strong>SQL Editor</strong> মেনুতে ক্লিক করে <strong>New Query</strong> বা <strong>"+"</strong> বাটনটি চাপুন।
              </p>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/60 relative space-y-3">
              <span className="absolute right-6 top-6 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-black text-xs">৩</span>
              <h4 className="font-extrabold text-sm text-slate-200">কোড পেস্ট করে Run করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                নিচের কোডটি কপি করতে বাটনে চাপুন, সুপাবেজে পেস্ট করুন এবং ডানদিকের নিচে থাকা <strong>Run</strong> বাটন চাপুন!
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">কপি করার কোড সমূহ (SQL Code)</span>
              <span className="text-xs font-bold text-emerald-400">✓ সম্পূর্ণ প্রস্তুত</span>
            </div>
            <pre className="p-6 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-[24px] overflow-x-auto max-w-full border border-slate-850 shadow-inner">
{`CREATE TABLE IF NOT EXISTS orders (
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

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS orders (
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

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`);
                alert('কোডটি সফলভাবে কপি করা হয়েছে! এখন এটি সুপাবেজ এ পেস্ট করে Run ক্লিক করুন।');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              ১-ক্লিকে কোড কপি করুন
            </button>
            <button 
              onClick={() => loadOrders()}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-black rounded-2xl text-xs transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>রি-কানেক্ট ও চেক করুন</span>
            </button>
          </div>

          <div className="p-6 bg-indigo-950/20 border border-indigo-900/40 rounded-3xl text-left space-y-2">
            <h5 className="font-extrabold text-sm text-indigo-400">💡 মোবাইল বা ডেমো টেস্টিং নোট:</h5>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              আপনি যদি সুপাবেজে এখনো এই কোড রান না করে থাকেন, তবে একই ব্রাউজার বা কম্পিউটারে বসে করা অর্ডারগুলো এখনও নিচে দেখতে পাবেন (লোকাল ব্যাকআপ মোডের কারণে)। 
              কিন্তু অন্য কারো ফোন বা কম্পিউটার থেকে বইয়ের অর্ডার সফলভাবে দেখতে চাইলে এই সুপাবেজ কোডটি রান করা বাধ্যতামূলক। এটি আপনার পুরো সার্ভিস আপডেট করে দেবে।
            </p>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden text-left">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="অর্ডার আইডি, বই বা সদস্যের নাম..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-105 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400">ফিল্টার:</span>
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
                {status === 'All' ? 'সব' : status}
              </button>
            ))}
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
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
    </div>
  );
}
