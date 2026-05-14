import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { loginMember, fetchMembersFromSheet } from '@/src/lib/googleSheets';

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

    const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_MEMBERS_URL || localStorage.getItem('sheet_members') || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjbvT42nJIt_6goEZeYH0vzeACzf6tmANoUJeUTFpSBIJzrbQJ7xMZwlTZ5g7KJiPDYR1gdjWVdfNt/pub?output=csv';
    
    if (!sheetUrl) {
      setError('সদস্য তালিকা খুঁজে পাওয়া যায়নি। অ্যাডমিন প্যানেলে গিয়ে Members CSV URL সেট করুন।');
      setLoading(false);
      return;
    }

    try {
      const members = await fetchMembersFromSheet(sheetUrl).catch((err) => {
        console.error('Fetch members error:', err);
        return [];
      });
      
      if (members.length === 0) {
        setError('শিট থেকে কোনো ডাটা পাওয়া যাচ্ছে না। শিটে ডাটা আছে কিনা বা ইউআরএল সঠিক কিনা নিশ্চিত করুন।');
        setLoading(false);
        return;
      }

      const user = await loginMember(sheetUrl, identifier, password);
      if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        navigate('/account');
      } else {
        // Find why login failed
        const id = identifier.trim();
        const idNormalized = id.replace(/\D/g, '');

        const userFound = members.find(m => {
           const mId = String(m.id || '').trim();
           const mName = String(m.name || '').trim().toLowerCase();
           const mPhone = String(m.phone || '').trim();
           const mEmail = String(m.email || '').trim().toLowerCase();
           const mPhoneNormalized = mPhone.replace(/\D/g, '');
           const idLower = id.toLowerCase();
           
           const phoneMatch = mPhoneNormalized !== '' && idNormalized !== '' && (
             mPhoneNormalized === idNormalized || 
             mPhoneNormalized.endsWith(idNormalized) || 
             idNormalized.endsWith(mPhoneNormalized)
           );

           return mId === id || mName === idLower || mEmail === idLower || phoneMatch;
        });

        if (userFound) {
            const mStatus = String(userFound.status || '').toLowerCase();
            const mPass = String(userFound.password || '').trim();
            
            if (mPass !== password) {
                setError('পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
            } else if (mStatus !== 'accepted') {
                if (mStatus === 'pending') {
                    setError('আপনার সদস্যপদ এখনো পেন্ডিং রয়েছে। এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।');
                } else if (mStatus === 'rejected') {
                    setError('আপনার সদস্যপদটি বাতিল করা হয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন।');
                } else {
                    setError('আপনার একাউন্টটি এখনো সক্রিয় করা হয়নি।');
                }
            }
        } else {
            setError('ইউজার আইডি বা ফোন নম্বরটি খুঁজে পাওয়া যায়নি। আপনি কি নিবন্ধন করেছেন?');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('লগইন ব্যর্থ হয়েছে। আপনার শিট কানেকশন বা ইন্টারনেট চেক করুন।');
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
        <p className="text-slate-400 text-sm mb-12">আপনার ইউজারনেম এবং পাসওয়ার্ড দিয়ে লগইন করুন</p>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">ID / Phone / Email</label>
             <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="আপনার আইডি বা ফোন নম্বর দিন"
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
