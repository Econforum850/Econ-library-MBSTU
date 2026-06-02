import { User, Crown, Heart, Loader2, Search, Image, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { db } from '@/src/lib/supabaseDatabase';

export default function Donors() {
  const [activeTab, setActiveTab] = useState<'members' | 'donations' | 'media'>('members');
  const [donors, setDonors] = useState<any[]>([]);
  const [recentDons, setRecentDons] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaLink, setMediaLink] = useState('');

  useEffect(() => {
    const loadAllContent = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Donors
        const fetched = await db.getDonors();
        setDonors(fetched.map((d: any) => ({
          name: d.name,
          title: d.type,
          location: d.impact || d.lastDonationDate || d.description || ''
        })));

        // 2. Fetch Recent Donations
        const rd = await db.getRecentDonations();
        setRecentDons(rd);

        // 3. Fetch Graphics Config for Google Drive Link
        const config = await db.getGraphicsConfig();
        if (config.donorMediaLink) {
          setMediaLink(config.donorMediaLink);
        }

        // 4. Fetch Media Gallery pictures
        const media = await db.getMediaGallery();
        setGalleryItems(media);

      } catch (err) {
        console.error('Error fetching donors page content:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllContent();
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
          className="text-sm font-bold text-indigo-400 uppercase tracking-[0.3em] mb-6"
        >
          আমাদের অগ্রযাত্রা
        </motion.p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'members' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-2 ring-indigo-500/20" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
              }`}
            >
                <Crown className={`w-4 h-4 ${activeTab === 'members' ? "text-white" : "text-amber-500"}`} />
                <span>সম্মানিত দাতা সদস্যবৃন্দ</span>
            </button>
            <button 
              onClick={() => setActiveTab('donations')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'donations' 
                ? "bg-rose-600 text-white shadow-xl shadow-rose-200 ring-2 ring-rose-500/20" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
              }`}
            >
                <Heart className={`w-4 h-4 ${activeTab === 'donations' ? "text-white" : "text-rose-500"}`} />
                <span>সাম্প্রতিক অনুদানসমূহ</span>
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'media' 
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-2 ring-emerald-500/20" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
              }`}
            >
                <Image className={`w-4 h-4 ${activeTab === 'media' ? "text-white" : "text-emerald-550"}`} />
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
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[28px] text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-550 transition-all shadow-sm placeholder:text-slate-400"
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
            className="bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-20 border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <div className="text-center mb-16">
                 <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 rounded-full shadow-sm border border-amber-200 mb-6">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h2 className="text-sm font-black text-slate-800">সম্মানিত দাতা সদস্যবৃন্দ</h2>
                 </div>
                 <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">যে সকল মহৎ ব্যক্তিদের অনুদানে আমাদের পাঠাগারের কার্যক্রম পরিচালিত হচ্ছে, আমরা তাঁদের প্রতি গভীরভাবে কৃতজ্ঞ।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDonors.map((donor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 10 }}
                  className="bg-slate-50 p-6 rounded-3xl border border-slate-150 flex items-center space-x-6 group hover:border-amber-500/30 hover:bg-slate-100/40 transition-all text-left shadow-sm"
                >
                   <div className="flex-shrink-0 w-16 h-16 bg-amber-100/40 rounded-2xl flex items-center justify-center relative border border-amber-200">
                     <User className="w-8 h-8 text-amber-600" />
                     <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full border border-amber-200 shadow-sm">
                        <Crown className="w-3 h-3 text-amber-500" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-amber-600 transition-colors truncate">{donor.name}</h3>
                     <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-bold text-amber-700 py-0.5 px-2 bg-amber-50 rounded-md border border-amber-200">{donor.title}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 font-medium">{donor.location}</span>
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
            className="bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-20 border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <div className="text-center mb-16">
                 <div className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-50 rounded-full shadow-sm border border-rose-200 mb-6">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-sm font-black text-slate-800">সাম্প্রতিক অনুদানসমূহ</h2>
                 </div>
                 <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">অল্প অল্প সংগ্রহই আমাদের এই বড় পথচলার পাথেয়। আপনাদের দান আমাদের লাইব্রেরিকে টিকিয়ে রাখতে সাহায্য করে।</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {recentDons.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-rose-200 rounded-3xl">
                  <p className="text-slate-400 font-bold text-sm">কোনো সাম্প্রতিক অনুদান রেকর্ড পাওয়া যায়নি।</p>
                </div>
              ) : (
                recentDons.map((donation, idx) => (
                  <motion.div
                    key={donation.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 p-6 rounded-3xl border border-slate-150 flex items-center justify-between text-left group hover:border-rose-500/20 hover:bg-slate-100/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-rose-100/45 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-rose-550" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 group-hover:text-rose-600 transition-colors">{donation.name}</h4>
                        <p className="text-xs text-slate-400 font-bold">{donation.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-650">৳{donation.amount}</div>
                      {donation.message && (
                        <p className="text-[10px] text-slate-450 italic">"{donation.message}"</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              
              <div className="mt-12 text-center p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm mb-6">আমাদের কাজগুলো চালিয়ে নিতে আপনিও অনুদান দিতে পারেন।</p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-white px-8 py-4 rounded-2xl border border-rose-200 shadow-sm text-center">
                    <span className="block text-[10px] font-bold text-rose-600 uppercase mb-1">বিকাশ/নগদ/রকেট</span>
                    <span className="text-lg font-black text-slate-800">01880412129</span>
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
            className="bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-16 border border-slate-100 text-center shadow-xl shadow-slate-200/40"
          >
            <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto mb-8">
              <div className="w-full h-full bg-emerald-100 rounded-[35px] rotate-6 border border-emerald-250 absolute inset-0 mix-blend-multiply" />
              <div className="w-full h-full bg-slate-50 rounded-[35px] border-4 border-emerald-100 absolute inset-0 -rotate-3 flex items-center justify-center shadow-lg">
                 <Image className="w-12 h-12 text-emerald-600" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">মিডিয়া ও স্মৃতিচারণ গ্যালারি</h2>
            <p className="text-slate-500 text-sm font-bold max-w-2xl mx-auto mb-12 leading-relaxed">
               লাইব্রেরির বই প্রদানকারী দাতা সদস্যদের ছবি ও ভিডিওগুলো আমরা যত্ন সহকারে আমাদের গুগল ড্রাইভে এবং ডাটাবেজে রেকর্ড করে রাখি।
            </p>

            {/* Live Configured Images Grid */}
            {galleryItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12 text-left">
                {galleryItems.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-150 shadow-sm group hover:border-emerald-500/40 hover:bg-slate-100/30 transition-all duration-350"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                      <img 
                        src={item.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={item.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 py-1 px-3 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-wider">
                        {item.date || 'স্মৃতি'}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {mediaLink ? (
              <a 
                href={mediaLink} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-250/20 active:scale-95 text-lg cursor-pointer"
              >
                <ExternalLink className="w-6 h-6" />
                <span>গুগল ড্রাইভে ছবি ও ভিডিও দেখুন</span>
              </a>
            ) : (
              <div className="inline-block px-8 py-5 bg-slate-50 border border-slate-200 rounded-[24px]">
                 <p className="text-emerald-600 font-bold">আপাতত ড্রাইভ লিঙ্ক যুক্ত করা হয়নি।</p>
                 <p className="text-xs text-slate-450 mt-2">অ্যাডমিন ড্যাশবোর্ড থেকে লিঙ্ক আপডেট করুন।</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
