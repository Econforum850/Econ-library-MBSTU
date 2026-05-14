import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../lib/cart';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard, ShoppingBag, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[60px] p-20 shadow-xl border border-slate-100 inline-block"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">আপনার কার্ট খালি</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto">আপনার পছন্দের বইটি খুঁজে নিতে আমাদের বই সংগ্রহশালা ঘুরে দেখুন।</p>
          <Link 
            to="/books" 
            className="inline-flex items-center space-x-3 px-10 py-5 bg-indigo-600 text-white rounded-[30px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>বই খুঁজতে যান</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-black text-slate-900">আপনার শপিং কার্ট</h1>
        <div className="flex items-center space-x-3">
           <span className="text-slate-400 font-bold">{totalItems} টি বই</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center space-x-6 md:space-x-10"
              >
                <div className="w-24 h-32 md:w-32 md:h-44 flex-shrink-0 bg-slate-100 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                  {item.cover && item.cover !== "" ? (
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 truncate leading-tight">{item.title}</h3>
                  <div className="text-rose-500 font-black text-lg mb-6">
                    {item.price > 0 ? `৳ ${item.price}` : 'প্রি-অর্ডার (বিনিময়যোগ্য)'}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 font-black text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl sticky top-32">
            <h2 className="text-2xl font-black text-slate-900 mb-8">অর্ডার সামারি</h2>
            
            <div className="space-y-6 mb-10 pb-10 border-b border-slate-50">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>উপ-মোট</span>
                <span>৳ {totalPrice}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>শিপিং চার্জ</span>
                <span className="text-emerald-500">ফ্রি</span>
              </div>
              <div className="flex justify-between items-center pt-6">
                <span className="text-xl font-black text-slate-900">সর্বমোট</span>
                <span className="text-2xl font-black text-indigo-600">৳ {totalPrice}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/register')}
              className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black flex items-center justify-center space-x-4 shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98] group"
            >
              <CreditCard className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="text-xl text-white">পেমেন্ট করুন</span>
            </button>

            <Link 
              to="/books" 
              className="mt-6 w-full py-4 text-slate-400 font-bold text-center block hover:text-slate-900 transition-colors"
            >
              আরও বই কিনুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
