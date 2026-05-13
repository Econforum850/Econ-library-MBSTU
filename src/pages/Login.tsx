import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white rounded-[48px] shadow-2xl shadow-indigo-100 border border-gray-100 p-10 md:p-16 text-center relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-10 text-white font-black text-2xl shadow-xl shadow-indigo-200">
           L
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2">স্বাগতম (WELCOME BACK)</h1>
        <p className="text-slate-400 text-sm mb-12">আপনার ইউজারনেম এবং পাসওয়ার্ড দিয়ে লগইন করুন</p>

        <form className="space-y-6 text-left">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Username</label>
             <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="ইউজারনেম দিন"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                />
             </div>
          </div>

          <div>
             <div className="flex items-center justify-between mb-3 ml-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">পাসওয়ার্ড</label>
                <Link to="#" className="text-[10px] font-bold text-indigo-500 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
             </div>
             <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                />
             </div>
          </div>

          <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
             <span>Sign in</span>
             <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center space-x-4">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Or continue with</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
        </div>

        <button className="mt-8 w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-[20px] font-bold flex items-center justify-center space-x-3 hover:bg-slate-50 transition-all active:scale-[0.98]">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            <span>Sign in with Google</span>
        </button>

        <p className="mt-10 text-xs text-slate-400 font-medium">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Become a member</Link>
        </p>
      </motion.div>
    </div>
  );
}
