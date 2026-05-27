import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, AtSign, Lock, ShieldCheck, CreditCard, Library, ArrowRight, Camera, CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/supabaseClient';
import { db } from '@/src/lib/supabaseDatabase';

export default function Register() {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'library'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    occupation: '',
    password: '',
    address: '',
    senderNumber: '',
    trxId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            occupation: formData.occupation,
            address: formData.address,
            paymentMethod,
            senderNumber: formData.senderNumber,
            trxId: formData.trxId,
            photo: photo || '',
            role: 'Member',
            status: 'accepted'
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        // Save profile to central database table
        await db.saveMember({
          id: data.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'Member',
          joinDate: new Date().toLocaleDateString('bn-BD'),
          status: 'accepted',
          dues: 0,
          photo: photo || '',
          address: formData.address,
          occupation: formData.occupation,
          password: formData.password
        }).catch(err => {
          console.warn('Profile write to DB deferred/failed:', err);
        });

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
      console.error(err);
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white rounded-[60px] shadow-2xl p-16 text-center"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-6">নিবন্ধন সম্পন্ন হয়েছে!</h2>
          <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
             <p className="text-slate-400 text-xs uppercase tracking-widest font-black mb-2">আপনার লগইন তথ্য</p>
             <p className="text-slate-700 font-black text-xl mb-1">আইডি: {formData.phone}</p>
             <p className="text-slate-700 font-black text-xl">পাসওয়ার্ড: {formData.password}</p>
          </div>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed text-lg">
            আপনার তথ্য আমাদের কাছে পৌঁছেছে। এডমিন আপনার তথ্য যাচাই করে সদস্যপদ সক্রিয় করবেন। লগইন করার সময় উপরের আইডি এবং পাসওয়ার্ড ব্যবহার করুন।
          </p>
          <Link to="/" className="inline-block px-12 py-5 bg-indigo-600 text-white rounded-[28px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
            হোমে ফিরে যান
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full bg-white rounded-[60px] shadow-2xl shadow-indigo-100 border border-gray-100 p-8 md:p-16 relative overflow-hidden"
      >
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-10 text-white font-black text-2xl shadow-xl shadow-indigo-200">
             L
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">পাঠাগারের সদস্য হোন</h1>
          <p className="text-slate-400 text-sm">উন্মুক্ত পাঠাগারের সদস্য হয়ে হাজার হাজার বই পড়ার সুযোগ নিন।</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-40 h-40 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                {photo && photo !== "" ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-10 h-10 text-slate-300 group-hover:text-indigo-400" />
                )}
              </div>
              <label className="absolute bottom-2 right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-700 transition-all active:scale-90">
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                <Camera className="w-5 h-5" />
              </label>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">আপনার ছবি আপলোড করুন</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">নাম (Full Name)</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="উদা: আরমান আলী" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">ইমেইল এড্রেস (Email Address)</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="উদা: arman@example.com" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">ফোন নাম্বার</label>
                <div className="relative group">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="উদা: ০১৮৮..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">পেশা (Occupation)</label>
                <div className="relative group">
                  <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required 
                    type="text" 
                    value={formData.occupation}
                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                    placeholder="উদা: ছাত্র / চাকুরীজীবি" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">পাসওয়ার্ড</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="একটি গোপন কোড দিন" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">ঠিকানা (Address)</label>
            <div className="relative group">
              <MapPin className="absolute left-6 top-5 w-5 h-5 text-slate-300" />
              <textarea 
                required 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="আপনার বর্তমান ঠিকানা লিখুন..." 
                className="w-full pl-14 pr-6 pt-4 pb-4 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold min-h-[120px]" 
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-[40px] p-10 border border-indigo-100/50 relative overflow-hidden">
               <div className="flex items-center space-x-3 mb-6">
                  <ShieldCheck className="w-8 h-8 text-indigo-600" />
                  <h3 className="text-xl font-black text-slate-800">নিবন্ধন ফি: ৳৫০</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <button type="button" onClick={() => setPaymentMethod('online')} className={cn("p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-all", paymentMethod === 'online' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")}>
                      <CreditCard className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Online Payment</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('library')} className={cn("p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-all", paymentMethod === 'library' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")}>
                      <Library className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Pay at Library</span>
                  </button>
               </div>

               <AnimatePresence mode="wait">
                 {paymentMethod === 'online' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-sm overflow-hidden">
                        <div className="text-center mb-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">এই নাম্বারে সেন্ডমানি করুন</span>
                            <div className="text-2xl font-black text-slate-900 tracking-wider">০১৮৮০৪১২১২৯</div>
                            <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-3 py-1 rounded-full mt-2 inline-block">(bKash/Nagad)</span>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">প্রেরক নাম্বার <span className="text-rose-500">*</span></label>
                                <input 
                                  type="text" 
                                  value={formData.senderNumber}
                                  onChange={(e) => setFormData({...formData, senderNumber: e.target.value})}
                                  placeholder="০১৮XXXXXXXX" 
                                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 text-sm font-bold" 
                                />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-4">ট্রানজেকশন আইডি <span className="text-rose-500">*</span></label>
                                <input 
                                  type="text" 
                                  value={formData.trxId}
                                  onChange={(e) => setFormData({...formData, trxId: e.target.value})}
                                  placeholder="Transaction ID (TRXID)" 
                                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 text-sm font-bold" 
                                />
                             </div>
                        </div>
                    </motion.div>
                 )}
               </AnimatePresence>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-sm font-bold animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black flex items-center justify-center space-x-3 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-8 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>প্রসেসিং হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>নিবন্ধন সম্পন্ন করুন</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-slate-400 font-bold">
            ইতিমধ্যে সদস্য? <Link to="/login" className="text-indigo-600 hover:underline">লগইন করুন</Link>
        </p>
      </motion.div>
    </div>
  );
}
