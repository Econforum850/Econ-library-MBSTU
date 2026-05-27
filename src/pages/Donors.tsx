import { User, Crown, Heart, Loader2, Search, Image, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { db } from '@/src/lib/supabaseDatabase';

const initialDonors: any[] = [];

const recentDonations: any[] = [];

export default function Donors() {
  const [activeTab, setActiveTab] = useState<'members' | 'donations' | 'media'>('members');
  const [donors, setDonors] = useState<any[]>(initialDonors);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaLink, setMediaLink] = useState('');

  useEffect(() => {
    // Media Link from localStorage
    const savedLink = localStorage.getItem('donor_media_link');
    if (savedLink) {
      setMediaLink(savedLink);
    }

    const loadDonors = async () => {
      try {
        setLoading(true);
        const fetched = await db.getDonors();
        setDonors(fetched.map((d: any) => ({
          name: d.name,
          title: d.type,
          location: d.impact || d.lastDonationDate || d.description || ''
        })));
      } catch (err) {
        console.error('Donors fetch error:', err);
        setDonors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, []);

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
       <div className="text-center mb-16">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-6"
        >
          আমাদের অগ্রযাত্রা
        </motion.p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'members' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
                <Crown className={`w-4 h-4 ${activeTab === 'members' ? "text-white" : "text-amber-500"}`} />
                <span>সম্মানিত দাতা সদস্যবৃন্দ</span>
            </button>
            <button 
              onClick={() => setActiveTab('donations')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'donations' 
                ? "bg-rose-600 text-white shadow-xl shadow-rose-200 ring-4 ring-rose-50" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
                <Heart className={`w-4 h-4 ${activeTab === 'donations' ? "text-white" : "text-rose-500"}`} />
                <span>সাম্প্রতিক অনুদানসমূহ</span>
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'media' 
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-4 ring-emerald-50" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
                <Image className={`w-4 h-4 ${activeTab === 'media' ? "text-white" : "text-emerald-500"}`} />
                <span>মিডিয়া ও স্মৃতিচারণ</span>
            </button>
        </div>

        {activeTab === 'members' && (
          <div className="relative w-full max-w-md mx-auto mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="দাতা সদস্যের নাম বা স্থান দিয়ে খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[28px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!loading && activeTab === 'members' ? (
          <motion.div 
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50/30 rounded-[40px] md:rounded-[60px] p-8 md:p-20 border border-amber-100"
          >
            <div className="text-center mb-16">
                 <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-amber-100 mb-6">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-black text-slate-900">সম্মানিত দাতা সদস্যবৃন্দ</h2>
                 </div>
                 <p className="text-slate-500 text-sm max-w-lg mx-auto">যে সকল মহৎ ব্যক্তিদের অনুদানে আমাদের পাঠাগারের কার্যক্রম পরিচালিত হচ্ছে, আমরা তাঁদের প্রতি গভীরভাবে কৃতজ্ঞ।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDonors.map((donor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 10 }}
                  className="bg-white p-6 rounded-3xl border border-amber-100/50 shadow-sm flex items-center space-x-6 group hover:shadow-md transition-all"
                >
                   <div className="flex-shrink-0 w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center relative">
                     <User className="w-8 h-8 text-amber-400" />
                     <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-amber-100">
                        <Crown className="w-3 h-3 text-amber-500" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                     <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate">{donor.name}</h3>
                     <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 py-0.5 px-2 bg-slate-50 rounded-md border border-slate-100">{donor.title}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-medium">{donor.location}</span>
                     </div>
                   </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : activeTab === 'donations' ? (
          <motion.div 
            key="donations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50/30 rounded-[40px] md:rounded-[60px] p-8 md:p-20 border border-rose-100"
          >
            <div className="text-center mb-16">
                 <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-rose-100 mb-6">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-xl font-black text-slate-900">সাম্প্রতিক অনুদানসমূহ</h2>
                 </div>
                 <p className="text-slate-500 text-sm max-w-lg mx-auto">অল্প অল্প সংগ্রহই আমাদের এই বড় পথচলার পাথেয়। আপনাদের দান আমাদের লাইব্রেরিকে টিকিয়ে রাখতে সাহায্য করে।</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {recentDonations.map((donation, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-rose-100/50 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{donation.name}</h4>
                      <p className="text-xs text-slate-400">{donation.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-600">৳ {donation.amount}</div>
                    <p className="text-[10px] text-slate-400 italic">"{donation.message}"</p>
                  </div>
                </motion.div>
              ))}
              
              <div className="mt-12 text-center p-8 bg-white/50 rounded-3xl border border-dashed border-rose-200">
                <p className="text-slate-500 text-sm mb-6">আমাদের কাজগুলো চালিয়ে নিতে আপনিও অনুদান দিতে পারেন।</p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-50">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">বিকাশ/নগদ/রকেট</span>
                    <span className="text-lg font-black text-slate-900">01880412129</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="media"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50/30 rounded-[40px] md:rounded-[60px] p-8 md:p-20 border border-emerald-100/50 text-center"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-10">
              <div className="w-full h-full bg-emerald-100 rounded-[35px] rotate-6 border border-emerald-200 absolute inset-0 mix-blend-multiply" />
              <div className="w-full h-full bg-white rounded-[35px] border-4 border-emerald-50 absolute inset-0 -rotate-3 flex items-center justify-center shadow-lg">
                 <Image className="w-16 h-16 text-emerald-300" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">মিডিয়া ও স্মৃতিচারণ গ্যালারি</h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-12">
               লাইব্রেরির বই প্রদানকারী দাতা সদস্যদের ছবি ও ভিডিওগুলো আমরা যত্ন সহকারে আমাদের গুগল ড্রাইভে আর্কাইভ করে রাখি।
            </p>

            {mediaLink ? (
              <a 
                href={mediaLink} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-lg"
              >
                <ExternalLink className="w-6 h-6" />
                <span>গুগল ড্রাইভে ছবি ও ভিডিও দেখুন</span>
              </a>
            ) : (
              <div className="inline-block px-8 py-5 bg-white border-2 border-dashed border-emerald-200 rounded-[24px]">
                 <p className="text-emerald-600 font-bold">আপাতত ড্রাইভ লিঙ্ক যুক্ত করা হয়নি।</p>
                 <p className="text-xs text-slate-400 mt-2">অ্যাডমিন ড্যাশবোর্ড থেকে লিঙ্ক আপডেট করুন।</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
