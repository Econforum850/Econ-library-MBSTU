import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import logoGold from '@/src/assets/images/logo_gold.png';
import { 
  User, 
  Phone, 
  MapPin, 
  AtSign, 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  Library, 
  ArrowRight, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Check, 
  Receipt,
  Eye,
  EyeOff,
  Sun,
  Lightbulb,
  Award
} from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebaseClient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/src/lib/supabaseDatabase';

// Framer Motion staggered variants
const formContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const formItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 15
    }
  }
};

export default function Register() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'library'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus tracking to power visual spotlights
  const [activeFocusedField, setActiveFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    occupation: '',
    password: '',
    address: '',
    senderNumber: '',
    trxId: '',
    receiptNumber: ''
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const timerPromise = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const emailInput = formData.email.trim();
      const phoneInput = formData.phone.trim();

      if (!formData.name) throw new Error('আপনার সম্পূর্ণ নাম প্রদান করুন।');
      if (!phoneInput) throw new Error('মোবাইল নম্বর প্রদান করা আবশ্যক।');
      if (!emailInput) throw new Error('ইমেইল এড্রেস প্রদান করা আবশ্যক।');
      if (!formData.password) throw new Error('একটি পাসওয়ার্ড প্রদান করুন।');
      if (paymentMethod === 'online' && (!formData.senderNumber || !formData.trxId)) {
        throw new Error('অনলাইন পেমেন্টের ক্ষেত্রে প্রেরক নম্বর এবং ট্রানজেকশন আইডি প্রদান করা আবশ্যক।');
      }
      if (paymentMethod === 'library' && !formData.receiptNumber) {
        throw new Error('লাইব্রেরিতে পেমেন্টের ক্ষেত্রে স্লিপ/রসিদ নম্বর প্রদান করা আবশ্যক।');
      }

      // Validate email format
      if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন।');
      }

      // 1. Core Duplication Safeguard - Fetch members to check duplicates in the database first
      const existingMembers = await db.getMembers();
      
      const emailDup = existingMembers.find(m => m.email && m.email.toLowerCase() === emailInput.toLowerCase());
      const phoneDup = existingMembers.find(m => m.phone && m.phone.trim() === phoneInput);

      if (emailDup) {
        let statusMsg = "";
        if (emailDup.status === 'pending') {
          statusMsg = "এই ইমেইল দিয়ে ইতিপূর্বে আবেদন করা হয়েছে এবং আবেদনটি বর্তমানে এডমিন প্যানেলে রিভিউয়ের জন্য প্রস্তুত (Pending) আছে।";
        } else if (emailDup.status === 'rejected') {
          statusMsg = "দুঃখিত, এই ইমেইল দিয়ে করা আবেদনটি পাঠাগার এডমিন দ্বারা বাতিল (Rejected) করা হয়েছে। অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।";
        } else {
          statusMsg = "এই ইমেইল দিয়ে ইতিপূর্বে একটি সক্রিয় সদস্য অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।";
        }
        throw new Error(statusMsg);
      }

      if (phoneDup) {
        let statusMsg = "";
        if (phoneDup.status === 'pending') {
          statusMsg = "এই মোবাইল নাম্বার দিয়ে ইতিপূর্বে আবেদন করা হয়েছে এবং আবেদনটি বর্তমানে এডমিন প্যানেলে রিভিউয়ের জন্য প্রস্তুত (Pending) আছে।";
        } else if (phoneDup.status === 'rejected') {
          statusMsg = "দুঃখিত, এই মোবাইল নাম্বার দিয়ে করা আবেদনটি পাঠাগার এডমিন দ্বারা বাতিল (Rejected) করা হয়েছে। অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।";
        } else {
          statusMsg = "এই মোবাইল নাম্বার দিয়ে ইতিপূর্বে একটি সক্রিয় সদস্য অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।";
        }
        throw new Error(statusMsg);
      }

      let finalUserId = `M-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
      let authUserObj: any = null;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, formData.password);
        if (userCredential.user) {
          finalUserId = userCredential.user.uid;
          authUserObj = userCredential.user;
        }
      } catch (authException: any) {
        console.warn("Exception in Auth signup flow. Continuing with direct database registration:", authException);
        if (authException.code === 'auth/email-already-in-use' || (authException.message && authException.message.includes('email-already-in-use'))) {
          throw new Error('এই ইমেইল এড্রেসটি ইতিমধ্যেই রেজিস্টার্ড করা হয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন বা লগইন করুন।');
        }
      }

      // 2. Save profile representing the user application to supabase database table
      const savedMem = await db.saveMember({
        id: finalUserId,
        name: formData.name,
        email: emailInput,
        phone: phoneInput,
        role: 'Member',
        joinDate: new Date().toLocaleDateString('bn-BD'),
        status: 'pending', // Pending approval by library admin
        dues: 0,
        photo: photo || '',
        address: formData.address,
        occupation: formData.occupation,
        password: formData.password,
        paymentMethod,
        senderNumber: paymentMethod === 'online' ? formData.senderNumber : '',
        trxId: paymentMethod === 'online' ? formData.trxId : formData.receiptNumber,
      });

      const loggedInUserObj = {
        id: savedMem.id,
        email: savedMem.email || emailInput,
        name: savedMem.name || formData.name,
        phone: savedMem.phone || phoneInput,
        occupation: savedMem.occupation || formData.occupation,
        address: savedMem.address || formData.address,
        photo: savedMem.photo || photo || '',
        status: savedMem.status || 'pending',
        role: savedMem.role || 'Member',
        dues: savedMem.dues ?? 0
      };
      
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUserObj));

      await timerPromise;
      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 md:py-20 min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Spotlights */}
      <motion.div 
        animate={{
          x: [-40, 50, -20, -40],
          y: [0, -30, 40, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-96 h-96 bg-indigo-150/40 rounded-full blur-[110px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          x: [30, -40, 60, 30],
          y: [0, 40, -20, 0]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 0.5 }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-[130px] pointer-events-none" 
      />

      {/* Main Luxury Container card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="w-full max-w-6xl bg-white/80 backdrop-blur-md rounded-[50px] border border-slate-100 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* Left Side: Cinematic Art Canvas */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-14 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#161233] to-[#251f4d] border-r border-slate-150/10">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-505/20 rounded-full blur-[130px] pointer-events-none" />
          
          {/* Brand Header */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            className="space-y-3 relative z-10 text-left"
          >
            <Link to="/" className="inline-flex items-center space-x-3.5 group select-none">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1 border border-slate-700/30 overflow-hidden shadow-xl group-hover:rotate-[6deg] transition-all">
                <img src={logoGold} alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white leading-none tracking-wide">ইকোলাইব্রেরি</span>
                <span className="text-[9px] text-indigo-300 font-black tracking-[0.18em] uppercase mt-1.5">DEPARTMENT OF ECONOMICS MBSTU</span>
              </div>
            </Link>
          </motion.div>

          {/* Central Orbit Node Experience */}
          <div className="my-10 relative flex items-center justify-center h-72">
            <div className="absolute w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl animate-pulse" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute w-64 h-64 border border-dashed border-indigo-400/15 rounded-full"
            />

            <motion.div 
              animate={{ 
                y: [0, -16, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex flex-col items-center cursor-pointer"
              whileHover={{ scale: 1.08 }}
            >
              <div className="w-28 h-28 rounded-[36px] bg-indigo-950/40 border border-indigo-500/30 shadow-2xl flex items-center justify-center backdrop-blur-xl relative">
                <User className="w-12 h-12 text-indigo-300" />
                <Sparkles className="absolute top-2 right-2 w-4.5 h-4.5 text-amber-300 animate-pulse" />
              </div>
              
              <div className="absolute -bottom-2 px-4 py-1.5 bg-[#0e0a25] border border-indigo-500/20 rounded-xl shadow-lg flex items-center space-x-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-[9px] text-indigo-200 font-mono font-black uppercase tracking-wider">SECURE PASS</span>
              </div>
            </motion.div>

            {/* Drifting float nodes */}
            <motion.div
              animate={{
                x: [-10, 10, -10],
                y: [0, -12, 0]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-4 py-2 px-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-1.5 shadow-md"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">KNOWLEDGE MATRIX</span>
            </motion.div>

            <motion.div
              animate={{
                x: [10, -10, 10],
                y: [10, 0, 10]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="absolute bottom-6 right-2 py-2 px-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-1.5 shadow-md"
            >
              <Sun className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">GLOBAL STANDARDS</span>
            </motion.div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-800/80 text-left relative z-10">
            <h4 className="text-sm font-black text-slate-200">জ্ঞানের আলো ছড়িয়ে যাক...</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              হাজারো শিক্ষার্থীদের সুশৃঙ্খল রেফারেন্স বুক ট্র্যাকিং সুবিধা সরবরাহ করতে এবং অর্থনৈতিক তত্ত্ব আলোচনার গতি বাড়িয়ে দিতে আমাদের ডিজিটাল পাঠাগার সর্বদা আপনার পাশে।
            </p>
          </div>
        </div>

        {/* Right Side: Responsive dynamic Sign Up layout */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center p-6 md:p-12 bg-slate-50/50 relative overflow-hidden">
          
          {/* High end focus spotlight that slides around based on selected field */}
          <div 
            className={`absolute transition-all duration-700 rounded-full blur-[110px] pointer-events-none ${
              activeFocusedField === 'name' ? 'w-64 h-64 top-1/6 left-1/4 bg-indigo-500/10' :
              activeFocusedField === 'email' ? 'w-64 h-64 top-1/3 right-1/4 bg-emerald-500/10' :
              activeFocusedField === 'phone' ? 'w-64 h-64 bottom-1/3 left-1/3 bg-indigo-500/10' :
              'w-48 h-48 top-0 right-0 bg-indigo-100/30'
            }`}
          />

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="signup-form"
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="w-full bg-white rounded-[40px] border border-slate-100 shadow-2xl p-8 md:p-10 relative overflow-hidden"
              >
                {/* Form Header */}
                <motion.div variants={formItemVariants} className="text-left mb-8 relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-mono">MEMBERSHIP PORTAL</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL Connection
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">পাঠাগারের সদস্য হোন</h1>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    অর্থনীতি উন্মুক্ত পাঠাগারের সদস্য হয়ে নতুন দিগন্ত উন্মোচন করুন। অতি সল্প সময়ে আপনার আবেদনটি সাবমিট করুন।
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6 text-left relative z-10">
                  
                  {/* Avatar Upload dropzone with reactive hover effects */}
                  <motion.div 
                    variants={formItemVariants}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-inner relative group cursor-pointer"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative cursor-pointer w-22 h-22 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-650 bg-white shadow-md flex flex-col items-center justify-center overflow-hidden transition-all"
                    >
                      {photo ? (
                        <>
                          <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-1.5 flex flex-col items-center justify-center space-y-1">
                          <Camera className="w-5 h-5 text-indigo-550 animate-pulse" />
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Upload Photo</span>
                        </div>
                      )}
                    </motion.div>
                    <input 
                      id="avatar-dropzone"
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                    />
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-3 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> সদস্য ছবি সাবমিট করুন (Optional)
                    </span>
                  </motion.div>

                  {/* Form fields grid with tactile focus springs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <motion.div variants={formItemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">নাম (Full Name) <span className="text-rose-500 font-bold">*</span></label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'name' ? 'text-indigo-600' : 'text-slate-450'}`} />
                        <motion.input 
                          whileFocus={{ scale: 1.01 }}
                          required 
                          type="text" 
                          value={formData.name}
                          onFocus={() => setActiveFocusedField('name')}
                          onBlur={() => setActiveFocusedField(null)}
                          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                          placeholder="উদা: আরমান আলী" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800" 
                        />
                      </div>
                    </motion.div>

                    {/* Occupation */}
                    <motion.div variants={formItemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">পেশা / বিভাগ (Occupation)</label>
                      <div className="relative">
                        <AtSign className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'occupation' ? 'text-indigo-600' : 'text-slate-450'}`} />
                        <motion.input 
                          whileFocus={{ scale: 1.01 }}
                          required 
                          type="text" 
                          value={formData.occupation}
                          onFocus={() => setActiveFocusedField('occupation')}
                          onBlur={() => setActiveFocusedField(null)}
                          onChange={(e) => setFormData(prev => ({...prev, occupation: e.target.value}))}
                          placeholder="উদা: অর্থনীতি বিভাগ, রোল ০৩" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800" 
                        />
                      </div>
                    </motion.div>

                    {/* Email Field */}
                    <motion.div variants={formItemVariants} className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">ইমেইল এড্রেস (Email Address) <span className="text-rose-500 font-bold">*</span></label>
                      <div className="relative">
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'email' ? 'text-indigo-600' : 'text-slate-450'}`} />
                        <motion.input 
                          whileFocus={{ scale: 1.01 }}
                          required
                          type="email" 
                          value={formData.email}
                          onFocus={() => setActiveFocusedField('email')}
                          onBlur={() => setActiveFocusedField(null)}
                          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                          placeholder="ecoXXXX@mbstu.ac.bd" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-805" 
                        />
                      </div>
                    </motion.div>

                    {/* Password Field */}
                    <motion.div variants={formItemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">পাসওয়ার্ড (Password) <span className="text-rose-500 font-bold">*</span></label>
                      <div className="relative">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'password' ? 'text-indigo-600' : 'text-slate-455'}`} />
                        <motion.input 
                          whileFocus={{ scale: 1.01 }}
                          required 
                          type={showPassword ? "text" : "password"} 
                          value={formData.password}
                          onFocus={() => setActiveFocusedField('password')}
                          onBlur={() => setActiveFocusedField(null)}
                          onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                          placeholder="গোপন পিন/কোড নির্ধারণ করুন" 
                          className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800" 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Mobile Number Field */}
                    <motion.div variants={formItemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">মোবাইল নম্বর (Mobile) <span className="text-rose-500 font-bold">*</span></label>
                      <div className="relative">
                        <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'phone' ? 'text-indigo-600' : 'text-slate-350'}`} />
                        <motion.input 
                          whileFocus={{ scale: 1.01 }}
                          required 
                          type="text" 
                          value={formData.phone}
                          onFocus={() => setActiveFocusedField('phone')}
                          onBlur={() => setActiveFocusedField(null)}
                          onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                          placeholder="০১৭XXXXXXXX" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-800" 
                        />
                      </div>
                    </motion.div>

                  </div>

                  {/* Address Field */}
                  <motion.div variants={formItemVariants} className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">ঠিকানা (Campus / Address) <span className="text-rose-500 font-bold">*</span></label>
                    <div className="relative">
                      <MapPin className={`absolute left-3.5 top-4.5 w-4.5 h-4.5 transition-colors ${activeFocusedField === 'address' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <motion.textarea 
                        whileFocus={{ scale: 1.01 }}
                        required 
                        value={formData.address}
                        onFocus={() => setActiveFocusedField('address')}
                        onBlur={() => setActiveFocusedField(null)}
                        onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                        placeholder="আপনার বর্তমান বিভাগ/রুম বা স্থায়ী ঠিকানা লিখুন..." 
                        className="w-full pl-10 pr-4 pt-3.5 pb-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all text-sm font-bold text-slate-808 min-h-[75px]" 
                      />
                    </div>
                  </motion.div>

                  {/* Interactive Payment Tabs */}
                  <motion.div variants={formItemVariants} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-black tracking-wide text-slate-850">মেম্বারশিপ সাবস্ক্রিপশন বিবরণ</span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">মাসিক ফি (১ বছরের জন্য):</span>
                        <span className="text-xs font-mono font-black text-emerald-600">৳৫০ / মাস</span>
                      </div>
                    </div>

                    {/* Dual-tab toggle mechanism with bouncing highlights */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                      <button 
                        id="tab-online-payment"
                        type="button" 
                        onClick={() => setPaymentMethod('online')} 
                        className={cn(
                          "py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95", 
                          paymentMethod === 'online' 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/15" 
                            : "text-slate-550 hover:text-slate-850"
                        )}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>বিকাশ / নগদ</span>
                      </button>
                      <button 
                        id="tab-pay-at-library"
                        type="button" 
                        onClick={() => setPaymentMethod('library')} 
                        className={cn(
                          "py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95", 
                          paymentMethod === 'library' 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/15" 
                            : "text-slate-555 hover:text-slate-850"
                        )}
                      >
                        <Library className="w-4 h-4" />
                        <span>লাইব্রেরি ডেস্কে</span>
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMethod === 'online' ? (
                        <motion.div 
                          key="online-details"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white rounded-xl p-4 border border-slate-150 space-y-3.5 overflow-hidden"
                        >
                          <div className="text-center py-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100">
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block mb-1">পার্সোনাল সেন্ড মানি নাম্বার (বিকাশ / নগদ)</span>
                            <div className="text-lg font-mono font-black text-indigo-905 tracking-widest">০১৮৮০৪১২১২৯</div>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">মাসিক ৫০ টাকা হিসেবে ১ বছরের জন্য মোট ৬০০ টাকা পাঠানোর পর প্রেরক নম্বর ও ট্রানজেকশন আইডি দিন</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="space-y-1 text-left">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">প্রেরক মোবাইল নম্বর <span className="text-indigo-400">*</span></label>
                              <input 
                                id="sender-number-field"
                                type="text" 
                                value={formData.senderNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, senderNumber: e.target.value }))}
                                placeholder="০১৭XXXXXXXX" 
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-slate-800 font-bold text-xs focus:outline-none" 
                              />
                            </div>
                            <div className="space-y-1 text-left">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">ট্রানজেকশন আইডি (TrxID) <span className="text-indigo-400">*</span></label>
                              <input 
                                id="trxid-field"
                                type="text" 
                                value={formData.trxId}
                                onChange={(e) => setFormData(prev => ({ ...prev, trxId: e.target.value }))}
                                placeholder="উদা: 9N02A902LQ" 
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-slate-800 font-bold text-xs focus:outline-none" 
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="library-details"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white rounded-xl p-4 border border-slate-150 space-y-3 overflow-hidden"
                        >
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
                            <h5 className="text-[11px] font-black text-indigo-650 mb-1">💡 রসিদ রুল নির্দেশনা:</h5>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                              সরাসরি অর্থনীতি বিভাগের পাঠাগার কাউন্টারে গিয়ে মাসিক ৫০ টাকা হিসেবে ১ বছরের জন্য মোট ৬০০ টাকা মেম্বারশিপ ফি ক্যাশ প্রদান করে একটি পে-স্লিপ সংগ্রহ করুন এবং রসিদে উল্লেখিত স্লিপ নম্বরটি নিচে লিখুন।
                            </p>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block ml-1">রসিদ / কাউন্টার স্লিপ নম্বর <span className="text-indigo-400">*</span></label>
                            <div className="relative">
                              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                id="receipt-no-field"
                                type="text" 
                                value={formData.receiptNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                                placeholder="পে-স্লিপ বা রসিদ স্লিপ আইডি..." 
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-605 rounded-xl text-slate-808 font-bold text-xs focus:outline-none" 
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {error && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-start space-x-2.5 text-xs font-bold"
                    >
                      <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button 
                    variants={formItemVariants}
                    id="primary-submit-btn"
                    type="submit" 
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 transition-all text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>আবেদন প্রসেস হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>আবেদন জমা দিন</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </motion.button>
                </form>

                <motion.p 
                  variants={formItemVariants}
                  className="mt-8 text-center text-xs text-slate-400 font-extrabold pb-3"
                >
                  ইতিমধ্যে সদস্য হয়ে থাকলে? <Link to="/login" className="text-indigo-600 font-black hover:text-indigo-700 hover:underline">লগইন করুন</Link>
                </motion.p>
              </motion.div>
            ) : (
              // Success Panel
              <motion.div
                key="signup-success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-12 text-center shadow-2xl space-y-6 text-left"
              >
                {/* Glowing Core Success Ring Animation */}
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-md relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/15 animate-ping opacity-60" />
                  <CheckCircle2 className="w-10 h-10 relative z-10" />
                </div>

                <div className="space-y-3.5 text-center">
                  <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-650 font-extrabold rounded-xl text-[9px] uppercase tracking-widest inline-block">
                    ⚠️ অ্যাডমিন পেজে রিভিউয়ের অপেক্ষায় (Pending Review)
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none font-sans">সদস্যপদের আবেদন সফলভাবে জমা হয়েছে!</h2>
                  <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed max-w-xl mx-auto">
                    আপনার যাবতীয় তথ্য আমাদের ডাটাবেজে সাবমিট করা হয়েছে। অ্যাডমিন প্যানেল দ্রুত আপনার পেমেন্ট বা রসিদ ভেরিফাই করে আপনার একাউন্টটি সক্রিয় (Active) করবেন।
                  </p>
                </div>

                {/* Secure credentials box */}
                <div className="bg-slate-50 p-6 rounded-2.5xl border border-slate-100 text-left max-w-md mx-auto space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">লগইন ক্রেডেনশিয়াল (Credentials)</span>
                    <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">🔒 সুরক্ষিত আইডি</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">লগইন মোবাইল আইডি:</span>
                      <span className="text-xs font-mono font-black text-slate-800">{formData.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">পাসওয়ার্ড কোড:</span>
                      <span className="text-xs font-mono font-black text-indigo-650">{formData.password}</span>
                    </div>
                  </div>
                </div>

                {/* Critical Gmail Notice Box */}
                <div className="p-5.5 bg-indigo-50/50 border border-indigo-100/80 rounded-2.5xl text-left max-w-xl mx-auto flex items-start space-x-3.5">
                  <Mail className="w-5.5 h-5.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <h5 className="font-extrabold text-[12px] text-indigo-900">📧 ইমেইল ও স্প্যাম ফোল্ডার ভেরিফিকেশন:</h5>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Check your email for validation alerts. If you do not view the mail in your core inbox within 1-2 minutes, check your <strong>Spam</strong> folder immediately to accept the credentials hook.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <motion.button 
                    id="back-home-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-650/10 transition-all font-sans tracking-widest uppercase"
                  >
                    CONTINUE TO ECONLIB PORTAL
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

    </div>
  );
}
