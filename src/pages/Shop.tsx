import { Search, ShoppingCart, Package, Heart, BookOpen, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useCart } from '../lib/cart';

import { useNavigate } from 'react-router-dom';

const shopBooks = [
  { id: 'sb1', title: 'রমাদাস প্ল্যানার', author: 'রমাদাস টিম', price: 350, category: 'নতুন বই', cover: 'https://placehold.co/400x600/312e81/white?text=Ramadan+Planner' },
  { id: 'sb2', title: 'আদর্শ উম্মাহ', author: 'ড. আলি সাল্লাবি', price: 450, category: 'নতুন বই', cover: 'https://placehold.co/400x600/10b981/white?text=Ideal+Ummah' },
];

export default function Shop() {
  const [orderId, setOrderId] = useState('');
  const { items, addItem, totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">বই বাজার</h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">নতুন বই কিনুন এবং আমাদের পাঠাগারের উন্নয়নে সাহায্য করুন। সরাসরি আপনার ঠিকানায় পৌঁছে দেব।</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-20 items-center max-w-5xl mx-auto">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="বইয়ের নাম বা লেখক দিয়ে খুঁজুন..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[30px] focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm text-lg"
          />
        </div>
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-3 px-8 py-5 bg-white border border-slate-200 rounded-[30px] text-slate-700 font-bold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm"
        >
          <ShoppingCart className="w-6 h-6 text-rose-500" />
          <span>কার্ট</span>
          <span className="w-7 h-7 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-black shadow-lg shadow-rose-100">
            {totalItems}
          </span>
        </button>
        <button className="px-10 py-5 bg-slate-900 text-white rounded-[30px] font-black flex items-center space-x-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">
          <Package className="w-6 h-6" />
          <span>অর্ডার ট্র্যাকিং</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 mb-32 px-4">
        {shopBooks.map((book) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group p-4"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 rounded-[36px]">
               <div className="absolute top-6 left-6 z-10">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-slate-900 text-xs font-black rounded-xl shadow-lg border border-slate-100 italic">
                  ৳ {book.price}
                </span>
              </div>
              <img 
                src={book.cover} 
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{book.category}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-rose-600 transition-colors">{book.title}</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">{book.author}</p>
              
              <button 
                onClick={() => addItem({...book, quantity: 1})}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black flex items-center justify-center space-x-3 hover:bg-rose-600 transition-all shadow-xl active:scale-95 group-hover:shadow-rose-100"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>শপিং কার্টে যোগ করুন</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Tracking Section */}
      <section className="max-w-3xl mx-auto bg-slate-50/50 rounded-[40px] p-12 md:p-16 border border-slate-100 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">অর্ডার ট্র্যাকিং</h2>
        <p className="text-slate-500 mb-10">অর্ডার করার সময় প্রাপ্ত ৬ সংখ্যার আইডিটি লিখে স্ট্যাটাস চেক করুন।</p>
        
        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="অর্ডার আইডি (যেমন: ১২৩৪৫৬)"
            className="w-full px-8 py-5 bg-white border border-slate-200 rounded-3xl text-center text-xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button className="w-full py-5 bg-indigo-400 text-white rounded-3xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
             স্ট্যাটাস দেখুন
          </button>
        </div>
      </section>
    </div>
  );
}
