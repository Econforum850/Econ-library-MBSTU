import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, UserPlus, CreditCard, Award, ArrowRight, Library, QrCode } from 'lucide-react';

export default function Membership() {
  const benefits = [
    {
      icon: BookOpen,
      title: 'বই ধার দেওয়া (Book Borrowing)',
      desc: 'সবচেয়ে আকর্ষণীয় সুবিধা। একইসাথে ২টি বই ১০ দিন পর্যন্ত নিজের কাছে পড়ার জন্য রাখার অধিকার।'
    },
    {
      icon: QrCode,
      title: 'ডিজিটাল আইডি কার্ড (Digital QR Card)',
      desc: 'অনলাইন প্রোফাইল থেকে ছবিযুক্ত এবং কিউআর কোড (QR Code) সংবলিত সদস্যকার্ড ডাউনলোড করার ক্ষমতা।'
    },
    {
      icon: ShieldCheck,
      title: 'অগ্রাধিকার অ্যাক্সেস (Priority Reserve)',
      desc: 'নতুন আসা দুর্লভ বই অথবা রেফারেন্স সিরিজের বইসমূহ সবার আগে বুক করার অগ্রাধিকার সুবিধা।'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">লাইব্রেরি সদস্যপদ | Library Membership</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-slate-900 leading-tight Beng-font"
          >
            লাইব্রেরি মেম্বারশিপ এবং নির্দেশিকা
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm md:text-base text-slate-650 font-medium max-w-2xl mx-auto"
          >
            অর্থনীতি বিভাগের শিক্ষার্থী ও শিক্ষকদের জন্য এটি একটি পূর্ণাঙ্গ ডিজিটাল লাইব্রেরি হাব। একটিমাত্র সদস্য পদে যুক্ত হয়ে উপভোগ করুন সব প্রিমিয়াম সুবিধা।
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] text-left hover:shadow-md transition-all group hover:-translate-y-1 duration-300"
              >
                <div className="w-11 h-11 rounded-1.5xl bg-indigo-50 border border-indigo-100/40 flex items-center justify-center shrink-0 mb-5 relative overflow-hidden">
                  <Icon className="w-5 h-5 text-[#352df2] relative z-10" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2 font-sans">{benefit.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{benefit.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Action / Requirements Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#060b18] text-white rounded-[32px] p-8 md:p-12 relative overflow-hidden border border-[#425585]/15 shadow-2xl shadow-indigo-950/15"
        >
          {/* Decorative backdrop elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#352df2]/15 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <Library className="w-4 h-4 text-indigo-400" /> সদস্যপদের যোগ্যতা ও নিয়মাবলি
              </span>
              <h2 className="text-2xl md:text-3.5xl font-black heading-font text-white leading-tight">
                কীভাবে ইকোলাইব্রেরির সদস্য হবেন?
              </h2>
              
              <ul className="space-y-3 text-slate-300 text-xs font-semibold">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mr-3 shrink-0 mt-0.5">১</span>
                  <span>অর্থনীতি বিভাগ, মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের যেকোনো বর্ষের সক্রিয় শিক্ষার্থী হতে হবে।</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mr-3 shrink-0 mt-0.5">২</span>
                  <span>মেম্বারশিপ ফর্ম ফিলআপের সময় ১ কপি পাসপোর্ট সাইজের ফরমাল ছবি জেপিজি (JPG) ফরম্যাটে আপলোড করতে হবে।</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mr-3 shrink-0 mt-0.5">৩</span>
                  <span>পরবর্তী বর্ষের জন্য কার্ড রিনিউ করতে বা হারিয়ে গেলে অর্থনীতি বিভাগের লাইব্রেরি ডেস্কে যোগাযোগ করুন।</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5 bg-white/5 border border-white/10 backdrop-blur-md rounded-2.5xl p-6 md:p-8 flex flex-col justify-between h-full text-left">
              <div>
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Online Registry Active
                </span>
                <h3 className="text-xl font-black text-white mt-4 font-sans">মেম্বারশিপ রেজিষ্ট্রেশন ফি</h3>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed mt-2">
                  লাইব্রেরির সাধারণ সদস্য ফি ৫০৳ (এককালীন)। নগদ বা রকেটের মাধ্যমে অনলাইনে অথবা সরাসরি লাইব্রেরি সহকারীর নিকট জমা দেওয়া যাবে।
                </p>
              </div>

              <div className="mt-8">
                <Link 
                  to="/register" 
                  className="w-full h-12 bg-[#352df2] hover:bg-[#2018da] text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/35 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>সদস্য হতে রেজিষ্ট্রেশন করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="text-center mt-3">
                  <Link to="/login" className="text-[10px] text-slate-400 hover:text-white transition-colors">
                    ইতিমধ্যেই অ্যাকাউন্ট আছে? লগইন করুন
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
