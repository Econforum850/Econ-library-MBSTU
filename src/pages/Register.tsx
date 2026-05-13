import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { User, Phone, MapPin, AtSign, Lock, ShieldCheck, CreditCard, Library, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';

export default function Register() {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'library'>('online');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-[60px] shadow-2xl shadow-indigo-100 border border-gray-100 p-8 md:p-16 text-center relative overflow-hidden"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-10 text-white font-black text-2xl shadow-xl shadow-indigo-200">
           L
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-2">পাঠাগারের সদস্য হোন</h1>
        <p className="text-slate-400 text-sm mb-12">উন্মুক্ত পাঠাগারের সদস্য হয়ে হাজার হাজার বই পড়ার সুযোগ নিন।</p>

        <div className="bg-indigo-50/50 rounded-[32px] p-8 mb-12 border border-indigo-100/50 text-left relative overflow-hidden">
             <div className="flex items-center space-x-3 mb-6">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-800">Registration Fee: ৳৫০</h3>
             </div>
             <p className="text-xs text-slate-500 mb-8 leading-relaxed">সদস্য হওয়ার জন্য ৫০ টাকা ফি প্রযোজ্য। আপনি চাইলে লাইব্রেরিতে এসে জমা দিতে পারেন অথবা অনলাইনে পাঠাতে পারেন।</p>
             
             <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setPaymentMethod('online')}
                    className={cn(
                        "p-6 rounded-2xl border-2 flex flex-col items-center justify-center transition-all",
                        paymentMethod === 'online' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                >
                    <CreditCard className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Online Payment</span>
                </button>
                <button 
                    onClick={() => setPaymentMethod('library')}
                    className={cn(
                        "p-6 rounded-2xl border-2 flex flex-col items-center justify-center transition-all",
                        paymentMethod === 'library' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                >
                    <Library className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pay at Library</span>
                </button>
             </div>

             {paymentMethod === 'online' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm"
                >
                    <div className="text-center mb-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Make Payment To</span>
                        <div className="text-xl font-black text-slate-900 tracking-wider">01880412129</div>
                        <span className="text-[10px] text-indigo-500 font-bold">(bKash/Nagad/Rocket)</span>
                    </div>

                    <div className="space-y-4">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Sender Number <span className="text-rose-500">*</span></label>
                            <input type="text" placeholder="01XXXXXXXXX" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Transaction ID (TRXID) <span className="text-rose-500">*</span></label>
                            <input type="text" placeholder="8NXXXXXX..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold" />
                         </div>
                    </div>
                </motion.div>
             )}
        </div>

        <form className="space-y-6 text-left">
           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input type="text" placeholder="আপনার পূর্ণ নাম" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="উদা: ০১৮৮..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Username</label>
                <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="উদা: minhaz2026" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                </div>
              </div>
           </div>

           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-5 w-5 h-5 text-slate-300" />
                <textarea placeholder="আপনার পূর্ণ ঠিকানা..." className="w-full pl-12 pr-4 pt-4 pb-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[100px]" />
              </div>
           </div>

           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input type="password" placeholder="একটি শক্তিশালী পাসওয়ার্ড দিন" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
              </div>
           </div>

           <button className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black flex items-center justify-center space-x-2 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-8 group">
              <span>Register as Reader</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
           </button>
        </form>

        <p className="mt-12 text-sm text-slate-400 font-medium">
            Already a member? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Log in instead</Link>
        </p>
      </motion.div>
    </div>
  );
}
