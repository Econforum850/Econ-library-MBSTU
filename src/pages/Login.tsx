import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/src/supabaseClient';
import { db } from '@/src/lib/supabaseDatabase';

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
      let isLogged = false;
      let loggedInUserObj: any = null;
      const cleanIdentifier = identifier.trim();

      // 1. Try traditional Supabase Auth if the identifier looks like an email address
      if (cleanIdentifier.includes('@')) {
        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanIdentifier,
            password: password
          });

          if (!authError && data?.user) {
            let dbMember: any = null;
            try {
              const members = await db.getMembers();
              dbMember = members.find(m => 
                (m.email && m.email.toLowerCase() === cleanIdentifier.toLowerCase()) ||
                m.id === data?.user?.id
              );
            } catch (findErr) {
              console.warn("Could not load associated member data, using Auth user info:", findErr);
            }

            loggedInUserObj = {
              id: dbMember?.id || data.user.id,
              email: dbMember?.email || data.user.email || '',
              name: dbMember?.name || data.user.user_metadata?.name || '',
              phone: dbMember?.phone || data.user.user_metadata?.phone || '',
              occupation: dbMember?.occupation || data.user.user_metadata?.occupation || '',
              address: dbMember?.address || data.user.user_metadata?.address || '',
              photo: dbMember?.photo || data.user.user_metadata?.photo || '',
              status: dbMember?.status || data.user.user_metadata?.status || 'accepted',
              role: dbMember?.role || data.user.user_metadata?.role || 'Member',
              dues: dbMember?.dues ?? 0
            };
            isLogged = true;
          }
        } catch (authErr) {
          console.warn("Supabase standard auth login failed/bypassed:", authErr);
        }
      }

      // 2. If standard Auth login is not completed (e.g., direct DB registration or phone used), query the dynamic 'members' table
      if (!isLogged) {
        try {
          const members = await db.getMembers();
          const foundMember = members.find(m => 
            (m.email && m.email.toLowerCase() === cleanIdentifier.toLowerCase()) ||
            (m.phone && m.phone.trim() === cleanIdentifier)
          );

          if (foundMember) {
            if (foundMember.password === password) {
              loggedInUserObj = {
                id: foundMember.id,
                email: foundMember.email,
                name: foundMember.name,
                phone: foundMember.phone,
                occupation: foundMember.occupation,
                address: foundMember.address,
                photo: foundMember.photo,
                status: foundMember.status,
                role: foundMember.role,
                dues: foundMember.dues || 0
              };
              isLogged = true;
            } else {
              throw new Error('ভুল পাসওয়ার্ড। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
            }
          } else {
            throw new Error('লগইন ব্যর্থ হয়েছে। আপনার প্রদানকৃত ইমেইল বা ফোন নাম্বার দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
          }
        } catch (dbErr: any) {
          throw new Error(dbErr.message || 'সার্ভারের সাথে যোগাযোগে ব্যর্থতা বা নেটওয়ার্ক সংযোগ অমিল।');
        }
      }

      if (isLogged && loggedInUserObj) {
        // Enforce Admin approval checks for standard members
        if (loggedInUserObj.role !== 'Admin') {
          if (loggedInUserObj.status === 'pending') {
            throw new Error('আপনার সদস্যপদের আবেদনটি এখনো অনুমোদন (Approve) করা হয়নি। এডমিন বর্তমানে এটি পর্যালোচনা করছেন। অনুগ্রহ করে অপেক্ষা করুন।');
          } else if (loggedInUserObj.status === 'rejected') {
            throw new Error('দুঃখিত, আপনার অ্যাকাউন্ট আবেদনটি কর্তৃপক্ষ দ্বারা বাতিল (Rejected) করা হয়েছে। অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।');
          }
        }
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUserObj));
        navigate('/');
      } else {
        throw new Error('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইমেইল/ফোন এবং পাসওয়ার্ড চেক করুন।');
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

        <Link to="/" className="inline-flex items-center space-x-3 group mb-10 select-none">
          <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:rotate-[12deg] transition-all duration-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-2xl font-black text-slate-900 leading-tight font-sans tracking-tight">ইকোলাইব্রেরি</span>
            <span className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">ECONOMICS MBSTU</span>
          </div>
        </Link>

        <h1 className="text-3xl font-black text-slate-900 mb-2">স্বাগতম (WELCOME BACK)</h1>
        <p className="text-slate-400 text-sm mb-12">আপনার ইমেইল বা ফোন নাম্বার এবং পাসওয়ার্ড দিয়ে লগইন করুন</p>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">ইমেইল বা ফোন নাম্বার (Email or Phone Number)</label>
             <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="আপনার ইমেইল অথবা ফোন নাম্বার দিন"
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
            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer"
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
