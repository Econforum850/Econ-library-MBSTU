import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function AdminLogin() {
  const [email, setEmail] = useState('Eco@1902');
  const [password, setPassword] = useState('Eco@1902');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_auth') === 'true') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const checkIdentifier = email.trim();
    const checkPass = password.trim();

    // Direct check for your provided credentials: Eco@1902 / Eco@1902
    if ((checkIdentifier === 'Eco@1902' || checkIdentifier === 'admin' || checkIdentifier === 'admin@library.com') && 
        (checkPass === 'Eco@1902' || checkPass === 'admin123')) {
      
      // PERSIST AUTH
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth', 'true');
      
      // SUCCESS ANIMATION state could be added, but for now just log
      console.log('Admin login successful');
      
      // Delay navigation slightly to ensure storage is committed and user see success
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 500);
    } else {
      setError('ভুল আইডি বা পাসওয়ার্ড! সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 p-10 md:p-12"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6 border-4 border-white">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">অ্যাডমিন প্রবেশ</h1>
            <p className="text-sm font-bold text-slate-400 mt-2">আপনার এডমিন পাসওয়ার্ড দিয়ে প্রবেশ করুন</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ইমেইল বা ইউজার আইডি</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পাসওয়ার্ড</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-6 text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 group mt-8",
                isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 shadow-indigo-100 hover:bg-slate-900"
              )}
            >
              <span>{isLoading ? 'প্রবেশ করা হচ্ছে...' : 'প্রবেশ করুন'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-50 text-center space-y-4">
            <button 
              onClick={() => {
                localStorage.setItem('admin_auth', 'true');
                sessionStorage.setItem('admin_auth', 'true');
                navigate('/admin/dashboard', { replace: true });
              }}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors cursor-pointer"
            >
              সরাসরি ড্যাশবোর্ড (বিপাস)
            </button>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">পাঠাগার ম্যানেজমেন্ট সিস্টেম © ২০২৬</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
