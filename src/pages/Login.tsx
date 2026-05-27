import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { loginMember, fetchMembersFromSheet } from '@/src/lib/googleSheets';
import { supabase } from '@/src/supabaseClient';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password
      });

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        const loggedInUserObj = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          phone: data.user.user_metadata?.phone || '',
          occupation: data.user.user_metadata?.occupation || '',
          address: data.user.user_metadata?.address || '',
          photo: data.user.user_metadata?.photo || '',
          status: data.user.user_metadata?.status || 'accepted',
          role: data.user.user_metadata?.role || 'Member'
        };
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUserObj));
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইমেইল এবং পাসওয়ার্ড চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white rounded-[48px] shadow-2xl shadow-indigo-100 border border-gray-100 p-10 md:p-16 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-10 text-white font-black text-2xl shadow-xl shadow-indigo-200">
           L
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2">স্বাগতম (WELCOME BACK)</h1>
        <p className="text-slate-400 text-sm mb-12">আপনার ইমেইল এবং পাসওয়ার্ড দিয়ে লগইন করুন</p>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">ইমেইল এড্রেস (Email Address)</label>
             <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="email" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="আপনার ইমেইল এড্রেস দিন"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                />
             </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70"
          >
             {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
               <>
                 <span>Sign in</span>
                 <ArrowRight className="w-5 h-5" />
               </>
             )}
          </button>
        </form>

        <p className="mt-10 text-xs text-slate-400 font-medium">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Become a member</Link>
        </p>
      </motion.div>
    </div>
  );
}
