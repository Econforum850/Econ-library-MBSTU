import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, RefreshCw, Loader2, CheckCircle2, Trash2, Edit2, 
  BookOpen, Coins, CircleCheck, AlertCircle, Bookmark, Tag, Library, 
  MapPin, X, Layers, Image as ImageIcon, BookMarked
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseBook } from '@/src/lib/supabaseDatabase';

export default function AdminShop() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'shop' | 'library'>('all');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<SupabaseBook | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form input states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('সাধারণ');
  const [price, setPrice] = useState('৳০');
  const [cover, setCover] = useState('');
  const [isEBook, setIsEBook] = useState(false);
  const [ebookUrl, setEbookUrl] = useState('');
  const [bookId, setBookId] = useState('');
  const [shelfNo, setShelfNo] = useState('N/A');
  const [status, setStatus] = useState<'available' | 'pre-order'>('available');
  const [stock, setStock] = useState(1);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const fetched = await db.getBooks();
      setBooks(fetched);
    } catch (err) {
      console.error('Failed to load books for admin shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setCategory('সাধারণ');
    setPrice('৳০');
    setCover('');
    setIsEBook(false);
    setEbookUrl('');
    setBookId(`BK-${Math.floor(100 + Math.random() * 900)}`);
    setShelfNo('N/A');
    setStatus('available');
    setStock(1);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: SupabaseBook) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setPrice(book.price || '৳০');
    setCover(book.cover || '');
    setIsEBook(book.isEBook || false);
    setEbookUrl(book.ebookUrl || '');
    setBookId(book.bookId || `BK-${Math.floor(100 + Math.random() * 900)}`);
    setShelfNo(book.shelfNo || 'N/A');
    setStatus(book.status);
    setStock(book.stock ?? 1);
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}" বইটি ডিলিট করতে চান?`)) {
      try {
        setLoading(true);
        await db.deleteBook(id);
        alert('বইটি সফলভাবে মুছে ফেলা হয়েছে!');
        await loadBooks();
      } catch (err) {
        console.error(err);
        alert('বই ডিলিট করতে ত্রুটি দেখা দিয়েছে।');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('সতর্কতা: ফাইলের সাইজ ১ মেগাবাইটের (1MB) কম হতে হবে!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCover(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      alert('দয়া করে শিরোনাম এবং লেখকের নাম লিখুন!');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<SupabaseBook> = {
        title,
        author,
        category,
        price,
        cover: cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
        isEBook,
        ebookUrl: isEBook ? ebookUrl : '',
        bookId,
        shelfNo,
        status,
        stock
      };

      if (editingBook) {
        payload.id = editingBook.id;
      }

      await db.saveBook(payload);
      alert(editingBook ? 'বইয়ের বিবরণী আপডেট করা হয়েছে!' : 'নতুন বই সফলভাবে যুক্ত করা হয়েছে!');
      setIsModalOpen(false);
      await loadBooks();
    } catch (err) {
      console.error(err);
      alert('তথ্য সংরক্ষণে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and Search Logic
  const filteredBooks = books.filter(b => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookId.toLowerCase().includes(searchTerm.toLowerCase());

    const isShop = b.price !== '৳০' && b.price?.toLowerCase() !== 'free' && b.price !== '';
    
    if (activeTypeFilter === 'shop') {
      return matchesSearch && isShop;
    }
    if (activeTypeFilter === 'library') {
      return matchesSearch && !isShop;
    }
    return matchesSearch;
  });

  const shopCount = books.filter(b => b.price !== '৳০' && b.price?.toLowerCase() !== 'free' && b.price !== '').length;
  const libraryCount = books.length - shopCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Banner / Header Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই ও শপ ব্যবস্থাপনা</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">লাইব্রেরির বই ক্যাটালগ এবং বুক শপের বিক্রয় সামগ্রী পরিচালনা করুন</p>
          
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wide border">
              ভান্ডার বই: {books.length} টি
            </span>
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wide border border-emerald-150">
              বিক্রয়যোগ্য আইটেম: {shopCount} টি
            </span>
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wide border border-indigo-150">
              লাইব্রেরি বুক: {libraryCount} টি
            </span>
          </div>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-3 px-8 py-4.5 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:shadow-none transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 flex-shrink-0 text-white" />
          <span className="text-white text-sm">নতুন ক্যাটালগ বই যুক্ত করুন</span>
        </button>
      </div>

      {/* Primary Catalog Management Grid */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Dynamic Controls & Toggle Controls */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="বইয়ের শিরোনাম, লেখক, আইডি বা ক্যাটাগরি..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border p-1 rounded-2xl">
            {[
              { id: 'all', label: `সকল সংগ্ৰহ (${books.length})`, icon: Layers },
              { id: 'shop', label: `বুক শপ (${shopCount})`, icon: Coins },
              { id: 'library', label: `লাইব্রেরি ধার (${libraryCount})`, icon: Library }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeFilter(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all",
                  activeTypeFilter === tab.id 
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-100" 
                    : "text-slate-500 hover:text-slate-850"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0 text-indigo-505" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={loadBooks}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shrink-0 active:scale-95"
            title="রিফ্রেশ"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Unified Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">বই টাইটেল ও আইডি</th>
                <th className="px-8 py-5"> লেখক / ক্যাটাগরি</th>
                <th className="px-8 py-5">সংগ্রহ ধরন / মূল্য</th>
                <th className="px-8 py-5">অবস্থান / সেলফ</th>
                <th className="px-8 py-5">স্টক পরিমাণ</th>
                <th className="px-8 py-5 overflow-hidden text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredBooks.map((book) => {
                const isShop = book.price !== '৳০' && book.price?.toLowerCase() !== 'free' && book.price !== '';
                return (
                  <tr key={book.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        {book.cover && book.cover !== "" ? (
                          <img src={book.cover} className="w-12 h-16 object-cover rounded-xl shadow-sm border border-slate-100 flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-16 bg-slate-50 border rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookMarked className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 leading-tight truncate max-w-xs">{book.title}</p>
                          <p className="text-[9px] font-mono font-black text-indigo-500 tracking-wider mt-1 block uppercase">ID: {book.bookId || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-bold text-slate-700">{book.author}</p>
                        <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 inline-block">{book.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5.5">
                      <div className="flex flex-col gap-1.5 items-start">
                        {isShop ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                            <Coins className="w-3 h-3" /> বুক শপ আইটেম
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                            <Library className="w-3 h-3" /> লাইব্রেরি সংগ্ৰহ
                          </span>
                        )}
                        <span className={cn(
                          "font-black text-[13px] pl-1.5",
                          isShop ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {book.price || 'Free'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1 text-slate-500 font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>রুম/সেলফ: {book.shelfNo || 'N/A'}</span>
                      </div>
                      {book.isEBook && (
                        <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-purple-100">ই-বুক পিডিএফ</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", (book.stock || 0) > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="font-extrabold text-slate-800 text-[13px]">{book.stock ?? 1} কপি</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenEditModal(book)}
                          className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBooks.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <Bookmark className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-extrabold text-lg">কোন বই ক্যাটালগ রের্কড পাওয়া যায়নি!</p>
                    <p className="text-slate-300 font-bold text-xs mt-1">অনুগ্রহ করে ভিন্ন কোনো কীওয়ার্ড ব্যবহার করুন অথবা নতুন বই অ্যাড করুন।</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Add/Edit Book Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[45px] border border-slate-100 p-8 md:p-10 shadow-2xl max-w-2xl w-full text-left my-8 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  <span>{editingBook ? 'বইয়ের বিবরণী সম্পাদন করুন' : 'নতুন বই যুক্ত করুন'}</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-150 rounded-full text-slate-450 hover:text-slate-900"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">বইয়ের নাম (শিরোনাম) *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="যেমন: অনুঘটক (ইকোনোমিক্স রিসার্চ ও গাইড)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">লেখকের নাম *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="অর্থনীতিবিদ"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">বইয়ের বিভাগ / বিষয়</label>
                    <input 
                      type="text" 
                      placeholder="যেমন: ইসলামী বই, ইকোনমিক্স"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Custom book ID & Shelf ID */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">বইয়ের কাস্টম আইডি (Book ID)</label>
                    <input 
                      type="text" 
                      value={bookId}
                      onChange={(e) => setBookId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Shelf No */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">সেলফ / আলমারি নং (Shelf No)</label>
                    <input 
                      type="text" 
                      value={shelfNo}
                      onChange={(e) => setShelfNo(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">বইয়ের বিক্রয়মূল্য (শপ বইয়ের জন্য)</label>
                    <input 
                      type="text" 
                      placeholder="৳১৫০ (লাইব্রেরি ধারের বই হলে ৳০ লিখুন)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-1">💡 "৳০" বা "Free" লিখলে বইটি মেম্বাররা ফ্রি রিড হিসেবে লাইব্রেরি থেকে ধার নেওয়ার অপশন পাবেন। অন্য কোন মূল্য দিলে তা বুক শপের আইটেম হিসেবে গণ্য হবে এবং কার্টে কেনার অপশন দেখাবে।</p>
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">স্টক পরিমাণ (কপি সংখ্যা)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                    />
                  </div>

                  {/* Cover image URL and file uploader */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-xs font-black text-slate-405 uppercase tracking-widest">বইয়ের কভার ইমেজ</label>
                    <input 
                      type="text" 
                      placeholder="কভার ইমেজের ডিরেক্ট ওয়েব লিংক জুড়ুন (যেমন: http://...)"
                      value={cover.startsWith('data:') ? '' : cover}
                      onChange={(e) => setCover(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-205 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-700"
                    />
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-500">ডিভাইস থেকে কভার আপলোড করুন</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>

                    {cover && (
                      <div className="flex items-center gap-4 p-3 bg-indigo-50/10 rounded-2xl border border-indigo-100/50 w-fit">
                        <img src={cover} alt="Catalog preview" className="w-12 h-16 object-cover rounded-xl shadow-md border" />
                        <div>
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">কভার ছবি সংযুক্ত হয়েছে</span>
                          <button type="button" onClick={() => setCover('')} className="text-xs text-rose-500 font-extrabold hover:underline">রিমুভ করুন</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PDF eBook Toggle and URL */}
                  <div className="md:col-span-2 p-5 bg-purple-50/30 border border-purple-100 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        id="isEBook_admin"
                        checked={isEBook}
                        onChange={(e) => setIsEBook(e.target.checked)}
                        className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                      />
                      <label htmlFor="isEBook_admin" className="font-black text-indigo-950 text-sm cursor-pointer select-none">এটি একটি ডিজিটাল ই-বুক (PDF Format)</label>
                    </div>

                    {isEBook && (
                      <div>
                        <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 pl-1">গুগল ড্রাইভ অথবা ই-বুক ড্রপবক্স লিংক</label>
                        <input 
                          type="url" 
                          placeholder="যেমন: https://drive.google.com/..."
                          value={ebookUrl}
                          onChange={(e) => setEbookUrl(e.target.value)}
                          className="w-full px-5 py-3.5 bg-white border border-purple-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
                    disabled={isSaving}
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="text-white">সংরক্ষণ সম্পন্ন হচ্ছে...</span>
                      </>
                    ) : (
                      <span className="text-white">{editingBook ? 'আপডেট করুন' : 'তালিকায় যুক্ত করুন'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
