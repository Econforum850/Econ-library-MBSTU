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
              {recentDons.length === 0 ? (
                <div className="text-center py-10 bg-white/50 border border-dashed border-rose-100 rounded-3xl">
                  <p className="text-slate-400 font-bold text-sm">কোনো সাম্প্রতিক অনুদান রেকর্ড পাওয়া যায়নি।</p>
                </div>
              ) : (
                recentDons.map((donation, idx) => (
                  <motion.div
                    key={donation.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-rose-100/50 shadow-sm flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800">{donation.name}</h4>
                        <p className="text-xs text-slate-450 font-bold">{donation.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-600">৳{donation.amount}</div>
                      {donation.message && (
                        <p className="text-[10px] text-slate-400 italic">"{donation.message}"</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              
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
            className="bg-emerald-50/30 rounded-[40px] md:rounded-[60px] p-8 md:p-16 border border-emerald-100/50 text-center"
          >
            <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto mb-8">
              <div className="w-full h-full bg-emerald-100 rounded-[35px] rotate-6 border border-emerald-200 absolute inset-0 mix-blend-multiply" />
              <div className="w-full h-full bg-white rounded-[35px] border-4 border-emerald-50 absolute inset-0 -rotate-3 flex items-center justify-center shadow-lg">
                 <Image className="w-12 h-12 text-emerald-300" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">মিডিয়া ও স্মৃতিচারণ গ্যালারি</h2>
            <p className="text-slate-500 text-sm font-bold max-w-2xl mx-auto mb-12">
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
                    className="bg-white rounded-3xl overflow-hidden border border-slate-150/60 shadow-sm group hover:shadow-md transition-all duration-350"
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
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug tracking-tight mb-2 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
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
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/25 active:scale-95 text-lg"
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
