import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Heart, Sparkles, Plus, Edit2, Trash2, 
  Save, CheckCircle2, Loader2, Link as LinkIcon, RefreshCw, X, Calendar, FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  db, GraphicsConfig, RecentDonation, MediaGalleryItem 
} from '@/src/lib/supabaseDatabase';

export default function AdminGraphics() {
  const [loading, setLoading] = useState(false);
  const [savingGraphics, setSavingGraphics] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Core configurations state
  const [heroBg, setHeroBg] = useState('');
  const [driveLink, setDriveLink] = useState('');
  
  // Lists
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaGalleryItem[]>([]);

  // Modals state
  const formatDisplayDateNum = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('bn-BD');
        }
      }
    } catch (e) {}
    return dateStr;
  };
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<RecentDonation | null>(null);
  const [donationForm, setDonationForm] = useState({
    name: '',
    amount: '',
    date: '',
    message: ''
  });

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaGalleryItem | null>(null);
  const [mediaForm, setMediaForm] = useState({
    title: '',
    imageUrl: '',
    date: '',
    description: ''
  });

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Fetch values
      const config = await db.getGraphicsConfig();
      setHeroBg(config.homeHeroBg);
      setDriveLink(config.donorMediaLink || '');

      const fetchedDonations = await db.getRecentDonations();
      setDonations(fetchedDonations);

      const fetchedMedia = await db.getMediaGallery();
      setMediaItems(fetchedMedia);
    } catch (err) {
      console.error('Error fetching admin graphics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setSavingGraphics(true);
      await db.saveGraphicsConfig({
        homeHeroBg: heroBg,
        donorMediaLink: driveLink
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      alert('কনফিগারেশন সংরক্ষণ করতে সমস্যা হয়েছে!');
    } finally {
      setSavingGraphics(false);
    }
  };

  // Recent Donation actions
  const openAddDonation = () => {
    setEditingDonation(null);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDonationForm({
      name: '',
      amount: '',
      date: `${yyyy}-${mm}-${dd}`,
      message: ''
    });
    setIsDonationModalOpen(true);
  };

  const openEditDonation = (rd: RecentDonation) => {
    setEditingDonation(rd);
    setDonationForm({
      name: rd.name,
      amount: rd.amount.toString(),
      date: rd.date,
      message: rd.message
    });
    setIsDonationModalOpen(true);
  };

  const handleDeleteDonation = async (id: string) => {
    if (window.confirm('আপনি কি এই সাম্প্রতিক অনুদানটি মুছে ফেলতে চান?')) {
      try {
        setLoading(true);
        await db.deleteRecentDonation(id);
        await loadAllData();
      } catch (err) {
        console.error('Error deleting donation:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.name || !donationForm.amount) {
      alert('দয়া করে নাম এবং টাকার পরিমাণ লিখুন!');
      return;
    }

    try {
      setLoading(true);
      await db.saveRecentDonation({
        id: editingDonation?.id,
        name: donationForm.name,
        amount: Number(donationForm.amount) || 0,
        date: donationForm.date,
        message: donationForm.message
      });
      setIsDonationModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Error saving donation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Media Actions
  const openAddMedia = () => {
    setEditingMedia(null);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMediaForm({
      title: '',
      imageUrl: '',
      date: `${yyyy}-${mm}-${dd}`,
      description: ''
    });
    setIsMediaModalOpen(true);
  };

  const openEditMedia = (item: MediaGalleryItem) => {
    setEditingMedia(item);
    setMediaForm({
      title: item.title,
      imageUrl: item.imageUrl,
      date: item.date || '',
      description: item.description || ''
    });
    setIsMediaModalOpen(true);
  };

  const handleDeleteMedia = async (id: string) => {
    if (window.confirm('আপনি কি এই মিডিয়া ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?')) {
      try {
        setLoading(true);
        await db.deleteMediaItem(id);
        await loadAllData();
      } catch (err) {
        console.error('Error deleting media item:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.title || !mediaForm.imageUrl) {
      alert('দয়া করে শিরোনাম এবং ছবির লিংক প্রদান করুন!');
      return;
    }

    try {
      setLoading(true);
      await db.saveMediaItem({
        id: editingMedia?.id,
        title: mediaForm.title,
        imageUrl: mediaForm.imageUrl,
        date: mediaForm.date,
        description: mediaForm.description
      });
      setIsMediaModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Error saving media item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-24">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">মিডিয়া ও গ্রাফিক্স সেটিংস</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">হোমপেজের পটভূমি, গ্যালারি ইমেজ এবং সাম্প্রতিক অনুদানসমূহ পরিচালনা করুন।</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadAllData}
            disabled={loading}
            className="p-4 bg-white border border-slate-250 rounded-[22px] text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button 
            onClick={handleSaveConfig}
            disabled={savingGraphics}
            className="px-8 py-4 bg-indigo-600 text-white rounded-[22px] font-black flex items-center space-x-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            {savingGraphics ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>সব সেটিংস সেভ করুন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[38px] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">হোমপেজ ব্যাকগ্রাউন্ড</h3>
                <p className="text-xs text-slate-400 font-bold">পটভূমি ইমেজের সরাসরি ডাটাবেজ লিংক</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">ব্যাকগ্রাউন্ড ইমেজ URL</label>
                <input 
                  type="text" 
                  value={heroBg}
                  onChange={(e) => setHeroBg(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {heroBg && (
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-150 shadow-inner relative group">
                  <img src={heroBg} className="w-full h-full object-cover" alt="Hero background preview" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-black px-4 py-2 bg-black/55 backdrop-blur-md rounded-xl">লাইভ প্রিভিউ</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">দাতা ড্রাইভ মেমোরি ফোল্ডার লিঙ্ক</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-normal ml-2">এটি "মিডিয়া ও স্মৃতিচারণ" ট্যাবে গ্যালারির ড্রাইভ বোতামের পেছনে লোড হবে।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Collections Management */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Dynamic Recent Donations Section */}
          <div className="bg-white p-8 md:p-10 rounded-[38px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">সাম্প্রতিক অনুদানসমূহ (Donations)</h3>
                  <p className="text-xs text-slate-400 font-bold">লাইভ ব্যাকএন্ডে সংরক্ষিত অনুদান তালিকা</p>
                </div>
              </div>
              <button 
                onClick={openAddDonation}
                className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95"
                title="নতুন অনুদান যুক্ত করুন"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {loading && donations.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-sm font-bold text-slate-400">কোনো সাম্প্রতিক অনুদান রেকর্ড পাওয়া যায়নি।</p>
                <p className="text-xs text-slate-350 mt-1">যুক্ত করতে '+' বাটনে চাপুন।</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {donations.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-55/40 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{d.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{formatDisplayDateNum(d.date)} • ৳{d.amount}</p>
                        {d.message && <p className="text-[11px] text-slate-500 italic mt-0.5">"{d.message}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditDonation(d)}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDonation(d.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Media Gallery Items Section */}
          <div className="bg-white p-8 md:p-10 rounded-[38px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">গ্যালারি চিত্রসমূহ (Media Items)</h3>
                  <p className="text-xs text-slate-400 font-bold">মিডিয়া ও স্মৃতিচারণ গ্যালারি ফোল্ডার ছবিসমূহ</p>
                </div>
              </div>
              <button 
                onClick={openAddMedia}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
                title="নতুন মিডিয়া ছবি যুক্ত করুন"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {loading && mediaItems.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-sm font-bold text-slate-400">কোনো গ্যালারি ছবি রেকর্ড পাওয়া যায়নি।</p>
                <p className="text-xs text-slate-350 mt-1">যুক্ত করতে '+' বাটনে চাপুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative overflow-hidden group rounded-2xl border border-slate-100 aspect-[4/3] bg-slate-100">
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-slate-950/80 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-white text-xs font-black leading-snug">{item.title}</h4>
                        {item.date && <p className="text-[10px] text-slate-400 mt-1">{formatDisplayDateNum(item.date)}</p>}
                        {item.description && <p className="text-[10px] text-slate-300 mt-1.5 leading-snug line-clamp-3">{item.description}</p>}
                      </div>
                      <div className="flex justify-end space-x-1.5">
                        <button 
                          onClick={() => openEditMedia(item)}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Donation Form Modal */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDonationSubmit} className="bg-white rounded-[40px] p-8 border border-slate-100 max-w-lg w-full space-y-6 text-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">
                {editingDonation ? 'অনুদান সম্পাদন' : 'নতুন অনুদান সংযোজন'}
              </h3>
              <button type="button" onClick={() => setIsDonationModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">দাতার নাম *</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: ড. সাজ্জাদ হোসেন"
                  value={donationForm.name}
                  onChange={(e) => setDonationForm({...donationForm, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">দানের পরিমাণ *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="যেমন: ৩০০০"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">দানের তারিখ</label>
                  <input 
                    type="date" 
                    value={donationForm.date}
                    onChange={(e) => setDonationForm({...donationForm, date: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-50 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">বার্তা (মেসেজ)</label>
                <input 
                  type="text" 
                  placeholder="যেমন: অর্থনীতি লাইব্রেরির সুন্দর ভবিষ্যৎ কামনা করছি।"
                  value={donationForm.message}
                  onChange={(e) => setDonationForm({...donationForm, message: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setIsDonationModalOpen(false)}
                className="px-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition"
              >
                বাতিল
              </button>
              <button 
                type="submit"
                className="px-8 py-3.5 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-600 transition"
              >
                সংরক্ষণ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Media Form Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleMediaSubmit} className="bg-white rounded-[40px] p-8 border border-slate-100 max-w-lg w-full space-y-6 text-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">
                {editingMedia ? 'ছবি সম্পাদন' : 'নতুন ছবি সংযোজন'}
              </h3>
              <button type="button" onClick={() => setIsMediaModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ছবির শিরোনাম *</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: বই হস্তান্তর অনুষ্ঠান মে ২০২৬"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({...mediaForm, title: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ছবির লিঙ্ক (Image URL) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={mediaForm.imageUrl}
                  onChange={(e) => setMediaForm({...mediaForm, imageUrl: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">তারিখ</label>
                  <input 
                    type="date" 
                    value={mediaForm.date}
                    onChange={(e) => setMediaForm({...mediaForm, date: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-50 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">বিবরণ</label>
                <input 
                  type="text" 
                  placeholder="যেমন: অর্থনীতি বিভাগের সম্মানিত দাতা সদস্য লাইব্রেরির জন্য ২৫টি বই প্রদান করছেন।"
                  value={mediaForm.description}
                  onChange={(e) => setMediaForm({...mediaForm, description: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setIsMediaModalOpen(false)}
                className="px-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition"
              >
                বাতিল
              </button>
              <button 
                type="submit"
                className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition"
              >
                সংরক্ষণ
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
