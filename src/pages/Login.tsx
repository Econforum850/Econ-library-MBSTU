import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingUp, 
  Sun, 
  Lightbulb,  
  Info,
  Layers,
  GraduationCap,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/src/supabaseClient';
import { db } from '@/src/lib/supabaseDatabase';

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 25, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Input active states to power reactive spotlights
  const [idFocused, setIdFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

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

      // 2. If standard Auth login is not completed (e.g. direct DB registration or phone used), query dynamic members table
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
        
        // Dispatch location change to update Navbar immediately
        window.dispatchEvent(new Event('storage'));
        
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
    <div className="py-12 md:py-20 min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Interactive Mesh Blurs that move slowly */}
      <motion.div 
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -40, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 left-20 w-[450px] h-[450px] bg-indigo-200/40 rounded-full blur-[130px] pointer-events-none" 
      />
      
      <motion.div 
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 60, -30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[140px] pointer-events-none" 
      />

      {/* Main Luxury App Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="w-full max-w-6xl bg-white/80 backdrop-blur-md rounded-[50px] border border-slate-100/90 shadow-2xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* LEFT SECTION: Stunning Interactive Storytelling Canvas */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-14 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#1c183a] to-indigo-950 border-r border-slate-150/10">
          
          {/* Constellation Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-84 h-84 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Left top brand signature with floating entry animation */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            className="relative z-10"
          >
            <Link to="/" className="inline-flex items-center space-x-3.5 group">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1 border border-slate-750/30 overflow-hidden shadow-lg transition-transform"
              >
                <img src="/src/assets/images/logo_gold.png" alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              </motion.div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black text-white tracking-wide leading-none">ইকোলাইব্রেরি</span>
                <span className="text-[9px] text-indigo-300 font-black tracking-[0.2em] uppercase mt-1.5">DEPARTMENT OF ECONOMICS MBSTU</span>
              </div>
            </Link>
          </motion.div>

          {/* Central Animated Scene: 3D-feeling Floating Book & Focus Elements */}
          <div className="my-auto py-12 relative flex items-center justify-center h-[380px]">
            {/* Spinning background geometric compass */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
              className="absolute w-72 h-72 border border-slate-800/40 rounded-full border-dashed"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              className="absolute w-[340px] h-[340px] border border-indigo-500/15 rounded-full border-dashed"
            />

            {/* Glowing Spotlight Behind Core Element */}
            <div className="absolute w-60 h-60 bg-indigo-650/20 rounded-full blur-[70px] animate-pulse" />

            {/* Core Interactive Floating Node (The Student Focus Cap and book) */}
            <motion.div
              animate={{
                y: [0, -18, 0],
                rotate: [0, 4, -4, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-20 flex flex-col items-center select-none cursor-pointer"
              whileHover={{ scale: 1.08 }}
            >
              {/* Luxury Glass Bubble enclosing structural icons */}
              <div className="w-44 h-44 rounded-full bg-slate-900/70 border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-center relative">
                <div className="flex flex-col items-center space-y-2">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-350"
                  >
                    <GraduationCap className="w-12 h-12" />
                  </motion.div>
                  <span className="text-[10px] font-black text-indigo-200 tracking-widest font-mono">LIVE CONNECTED</span>
                </div>

                {/* Floating micro star indicators */}
                <Sparkles className="absolute top-2 right-4 w-5 h-5 text-amber-300 animate-pulse" />
                <Sparkles className="absolute bottom-6 left-2 w-4 h-4 text-cyan-400 animate-pulse" />
              </div>

              {/* Dynamic Overlay Box representing Economics Analytics */}
              <motion.div
                animate={{
                  y: [-3, 3, -3],
                  rotate: [-2, 2, -2]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 px-5 py-3 bg-gradient-to-r from-[#171337] to-slate-900 border border-indigo-400/40 rounded-2xl shadow-2xl text-center space-y-1"
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[8px] font-mono font-black text-emerald-400 uppercase tracking-widest">+18% DEV SPEED</span>
                </div>
                <p className="text-[10px] font-black text-white tracking-wide">ECON DEVELOPMENT PATH</p>
              </motion.div>
            </motion.div>

            {/* Drifting floaters representing educational parameters */}
            <motion.div
              animate={{
                x: [-10, 10, -10],
                y: [0, -12, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-8 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">CREATIVE PAPERS</span>
            </motion.div>

            <motion.div
              animate={{
                x: [10, -10, 10],
                y: [12, 0, 12]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute bottom-10 right-2 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg"
            >
              <Sun className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">BRIGHT FUTURE</span>
            </motion.div>
          </div>

          {/* Left Section Footer Details with fading glow */}
          <div className="space-y-3 pt-6 border-t border-slate-800/80 text-left relative z-10">
            <p className="text-[10px] uppercase tracking-widest font-black text-indigo-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ECONOMICS MBSTU LATEST EDITION (2026)</span>
            </p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl font-medium">
              আপনার প্রয়োজনীয় সকল একাডেমিক রেফারেন্স বুক, রিসার্চ অ্যাসাইনমেন্ট সাপোর্ট এবং লাইব্রেরী বুক ইস্যু রিকোয়েস্ট এখন একটি মাত্র পোর্টাল থেকেই সহজে সম্পন্ন করুন।
            </p>
          </div>
        </div>

        {/* RIGHT SECTION: Upgraded Ultra-Responsive Interactive Login Card */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50/50 relative overflow-hidden">
          
          {/* Interactive Aura spotlight which follows input focus */}
          <div 
            className={`absolute transition-all duration-700 rounded-full blur-[110px] pointer-events-none ${
              idFocused ? "w-64 h-64 top-1/4 left-1/4 bg-indigo-500/10" :
              passFocused ? "w-64 h-64 bottom-1/4 right-1/4 bg-emerald-500/10" :
              "w-48 h-48 top-0 right-0 bg-indigo-100/30"
            }`}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md bg-white rounded-[40px] border border-slate-100/85 shadow-2xl shadow-indigo-950/5 p-8 md:p-10 relative overflow-hidden"
          >
            {/* Elegant Header containing micro interactive animations */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <Link to="/" className="lg:hidden inline-flex items-center space-x-2.5 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-200 overflow-hidden shadow-md">
                  <img src="/src/assets/images/logo_gold.png" alt="Econ Library Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tight">ইকোলাইব্রেরি</span>
              </Link>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                স্বাগতম ফিরে এসেছেন!
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-2.5 leading-relaxed">
                আপনার পাঠাগার আইডি (ইমেইল/মোবাইল) ও পাসওয়ার্ড কোডটি সাবমিট করুন
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-600 text-xs font-bold text-left shadow-inner animate-[shake_0.4s_ease-in-out_1]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                <span className="leading-normal">{error}</span>
              </motion.div>
            )}

            {/* Elastic Interactive Form fields */}
            <form onSubmit={handleLogin} className="space-y-6 text-left">
              
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block ml-1">
                  Email / Mobile / Member ID
                </label>
                <div className="relative group">
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setIdFocused(true)}
                    onBlur={() => setIdFocused(false)}
                    required
                    placeholder="যেমন: eco24034@mbstu.ac.bd"
                    className="w-full pl-5 pr-11 py-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-650 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800"
                  />
                  <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${idFocused ? "text-indigo-600" : "text-slate-400"}`} />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">
                    Password Code / পিন
                  </label>
                  <Link to="#" className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest hover:underline transition-all">
                    ভুলে গেছেন?
                  </Link>
                </div>
                <div className="relative group">
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    required
                    placeholder="পাসওয়ার্ড কোড লিখুন"
                    className="w-full pl-5 pr-11 py-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-655 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button showing active state loaders */}
              <motion.button 
                variants={itemVariants}
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(79, 70, 229, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 transition-all text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>ভেরিফাই হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন এক্সেস করুন</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Micro Informational Warning Banner */}
            <motion.div 
              variants={itemVariants}
              className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3 text-left shadow-sm"
            >
              <Info className="w-4.5 h-4.5 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-[10px] leading-relaxed font-bold text-slate-500">
                একই আইডেনটিটি দিয়ে একবারই নিবন্ধন আবেদন করুন। অ্যাডমিন ভেরিফিকেশন সফল হলেই আপনি ড্যাশবোর্ড থেকে বই এবং ই-বুক অ্যাক্সেস করতে পারবেন।
              </p>
            </motion.div>

            {/* Staggered Sign Up Action Footer */}
            <motion.p 
              variants={itemVariants}
              className="mt-8 text-xs text-slate-400 font-extrabold tracking-wide text-center"
            >
              নতুন সদস্য হতে চান? <Link to="/register" className="text-indigo-600 font-black hover:text-indigo-700 hover:underline transition-colors ml-1.5 bg-indigo-50 px-3 py-1.5 rounded-full inline-block">আবেদন করুন</Link>
            </motion.p>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
