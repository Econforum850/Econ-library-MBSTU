import { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Search, RefreshCw, 
  Loader2, CheckCircle2, ChevronRight,
  Eye, Truck, ExternalLink, Filter, User as UserIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

interface Order {
  id: string;
  customerName: string;
  date: string;
  total: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: string;
}

const initialOrders: Order[] = [
  { id: 'ORD-1234', customerName: 'Tanvir Ahmed', date: '12 May 2024', total: '৳৭০০', status: 'Pending', items: '২টি বই' },
  { id: 'ORD-1235', customerName: 'Sabbir Hossain', date: '10 May 2024', total: '৳৪৫০', status: 'Shipped', items: '১টি বই' },
];

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই বিক্রয় অর্ডার</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">শপ থেকে আসা সকল অর্ডার পরিচালনা করুন</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[28px] border border-slate-100">
            <div className="px-6 py-3 bg-white rounded-2xl shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">সক্রিয় অর্ডার</span>
                <span className="text-xl font-black text-slate-900">০২</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="অর্ডার আইডি বা নাম খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all"
                />
            </div>
            <div className="flex items-center space-x-4">
                 <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    <span>ফিল্টার</span>
                 </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">অর্ডার (Order)</th>
                <th className="px-8 py-5">গ্রাহক</th>
                <th className="px-8 py-5">পরিমাণ ও তারিখ</th>
                <th className="px-8 py-5">মুল্য</th>
                <th className="px-8 py-5 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 uppercase">
                    <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-rose-500" />
                        <span className="font-black text-slate-900">{order.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Link 
                      to={`/admin/users?search=${encodeURIComponent(order.customerName)}`}
                      className="flex items-center space-x-2 text-slate-700 hover:text-indigo-600 font-bold transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-300" />
                      <span>{order.customerName}</span>
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-500">{order.items}</p>
                    <p className="text-[10px] text-slate-400">{order.date}</p>
                  </td>
                  <td className="px-8 py-6 text-emerald-600 font-black text-lg">{order.total}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-4">
                        <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                        order.status === 'Pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        order.status === 'Shipped' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        order.status === 'Delivered' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>
                        {order.status}
                        </span>
                        <button className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-rose-200 transition-all text-slate-400 hover:text-rose-600">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

