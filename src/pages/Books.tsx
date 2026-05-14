import { Search, ChevronDown, BookOpen, Clock, X, ShoppingCart, User, CheckCircle2, Loader2, AlertCircle, Plus, Filter, FileText, Bookmark, ExternalLink, Download, Eye, TrendingUp, BarChart3, Globe, AlignLeft, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { fetchBooksFromSheet, SheetBook, submitToGoogleScript } from '../lib/googleSheets';

interface Book extends SheetBook {
  isEBook?: boolean;
  ebookUrl?: string;
}

const LOCAL_CATEGORIES = [
  { 
    id: 'islamic', 
    name: 'ইসলামী বই', 
    books: [
      { id: '1', title: 'কুফর তাকফির বিদআত-প্রান্তিকতা ও ভারসাম্য', author: 'মূল: শায়খ সালিহ আল ফাওযান', category: 'সাধারণ', cover: 'https://placehold.co/400x600/312e81/white?text=Takfir+Book', bookId: 'GEN-7618', shelfNo: 'N/A', status: 'pre-order' as const, price: '৳০' },
      { id: '2', title: 'তাফসীর ইবন কাসীর (১০-১১) খণ্ড', author: 'হাফিজ ইমাদউদ্দীন ইবন কাসীর (র)', category: 'ইসলামী বই', cover: 'https://placehold.co/400x600/1e3a8a/white?text=Tafsir', bookId: 'ISL-102', shelfNo: 'A-2', status: 'pre-order' as const, price: '৳০' },
    ]
  }
];

export default function Books() {
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'ebooks'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'pre-order'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { addItem, totalItems } = useCart();
  const navigate = useNavigate();

  const loggedInUser = useMemo(() => {
    const userStr = localStorage.getItem('loggedInUser');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const isAdmin = useMemo(() => {
    return loggedInUser?.role === 'Admin' || localStorage.getItem('isAdmin') === 'true';
  }, [loggedInUser]);

  const canAccessEBook = useMemo(() => {
    if (!loggedInUser?.email) return false;
    const email = loggedInUser.email.toLowerCase();
    // Pattern: eco(20|21|22|23|24|25)\d{3}@mbstu.ac.bd
    const pattern = /^eco(20|21|22|23|24|25)\d{3}@mbstu\.ac\.bd$/;
    return pattern.test(email);
  }, [loggedInUser]);

  // Form state for adding book
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'সাধারণ',
    price: '',
    cover: '',
    isEBook: false,
    description: '',
    ebookUrl: ''
  });

  useEffect(() => {
    const loadAllBooks = async () => {
      const libraryUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || localStorage.getItem('custom_sheet_url');
      const shopUrl = import.meta.env.VITE_GOOGLE_SHEET_SHOP_URL || localStorage.getItem('sheet_shop');
      
      try {
        setLoading(true);
        let allBooks: Book[] = [];

        if (libraryUrl) {
          const libraryBooks = await fetchBooksFromSheet(libraryUrl);
          allBooks = [...allBooks, ...libraryBooks];
        }

        if (shopUrl) {
          const shopBooks = await fetchBooksFromSheet(shopUrl);
          allBooks = [...allBooks, ...shopBooks];
        }

        if (allBooks.length === 0) {
          allBooks = LOCAL_CATEGORIES.flatMap(cat => cat.books) as Book[];
        }

        // De-duplicate by ID if necessary and mark eBooks based on category or price
        const processedBooks = allBooks.map(b => ({
          ...b,
          isEBook: b.category.toLowerCase().includes('e-book') || b.category.toLowerCase().includes('ই-বুক') || b.price === 'Free'
        }));

        setBooks(processedBooks);
      } catch (err) {
        console.error('Failed to fetch books:', err);
        setError('বইয়ের তালিকা লোড করতে সমস্যা হয়েছে।');
        setBooks(LOCAL_CATEGORIES.flatMap(cat => cat.books) as Book[]);
      } finally {
        setLoading(false);
      }
    };

    loadAllBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    let result = books.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 'ebooks') {
      result = result.filter(b => b.isEBook);
    } else if (activeTab === 'categories' && selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }

    if (priceFilter === 'free') {
      result = result.filter(b => b.price === '৳০' || b.price?.toLowerCase() === 'free');
    } else if (priceFilter === 'paid') {
      result = result.filter(b => b.price !== '৳০' && b.price?.toLowerCase() !== 'free');
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    return result;
  }, [books, searchTerm, activeTab, selectedCategory, priceFilter, statusFilter]);

  const categoryGroups = useMemo(() => {
    const groups: { [key: string]: Book[] } = {};
    filteredBooks.forEach(book => {
      const cat = book.category || 'অন্যান্য';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(book);
    });
    return groups;
  }, [filteredBooks]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(books.map(b => b.category)));
    return uniqueCategories.filter(c => c && c !== 'N/A');
  }, [books]);

  const handleAddToCart = (book: Book) => {
    const priceValue = parseInt(String(book.price || '0').replace(/[^0-9]/g, '')) || 0;
    addItem({
      id: book.id,
      title: book.title,
      price: priceValue,
      quantity: 1,
      cover: book.cover,
    });
    setSelectedBook(book);
    setIsAdded(true);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    
    if (scriptUrl) {
      const res = await submitToGoogleScript(scriptUrl, {
        ...newBook,
        type: 'add_book',
        sheetName: 'বই বাজার (Shop)',
        timestamp: new Date().toISOString()
      });
      if (res.success) {
        alert('বইটি সফলভাবে "বই বাজার (Shop)" তালিকায় যুক্ত করার জন্য পাঠানো হয়েছে!');
        setShowAddModal(false);
      }
    } else {
      // Local addition for demo
      const bookToAdd: Book = {
        id: `new-${Date.now()}`,
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        cover: newBook.cover || 'https://placehold.co/400x600/eee/999?text=New+Book',
        price: newBook.price || '৳০',
        bookId: `ID-${Math.floor(Math.random() * 1000)}`,
        shelfNo: 'Pending',
        status: 'pre-order',
        isEBook: newBook.isEBook
      };
      setBooks([bookToAdd, ...books]);
      setShowAddModal(false);
      alert('বইটি তালিকায় যুক্ত করা হয়েছে (ডেমো)।');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">বইয়ের তালিকা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* Header with modern economics aesthetic */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/5 blur-[100px] -z-10 rounded-full" />
        <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8">
          <TrendingUp className="w-4 h-4" />
          <span>Research & Digital Archive</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 font-sans tracking-tight leading-[1.1]">
          বইয়ের <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">ডিজিটাল ক্যাটালগ</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">ডিপার্টমেন্ট অফ ইকোনমিক্স ডিজিটাল লাইব্রেরি। আপনার প্রয়োজনীয় ক্যাটালগটি খুঁজে নিন এবং সংগ্রহের সমৃদ্ধি বাড়ান।</p>
      </div>

      {/* Advanced Navigation & Categories */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-16 px-4">
        {[
          { id: 'all', label: 'সকল সংগ্রহ', icon: BookOpen },
          { id: 'categories', label: 'বিভাগ অনুযায়ী', icon: Filter },
          { id: 'ebooks', label: 'ই-বুক আর্কাইভ', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-3 px-10 py-5 rounded-[28px] font-black transition-all active:scale-95 group",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-indigo-400" : "text-slate-400")} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Modern Search & Filters Area */}
      <div className="max-w-4xl mx-auto mb-24 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="বইয়ের নাম, লেখক বা ক্যাটাগরি দিয়ে খুঁজুন..."
              className="w-full pl-20 pr-8 py-7 bg-white border-2 border-slate-100 rounded-[40px] focus:outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-xl font-bold text-xl placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-7 rounded-[35px] border-2 transition-all shadow-xl active:scale-95 flex items-center justify-center",
                showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
              )}
            >
              <Filter className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-7 bg-white border-2 border-slate-100 rounded-[35px] text-slate-700 hover:bg-slate-50 transition-all shadow-xl active:scale-95 group"
            >
              <ShoppingCart className="w-6 h-6 group-hover:text-indigo-600" />
              <span className="absolute -top-1 -right-1 w-8 h-8 bg-indigo-600 text-white text-[11px] rounded-full flex items-center justify-center font-black shadow-lg ring-4 ring-white">
                {totalItems}
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10 bg-slate-900 rounded-[45px] shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-10 border border-slate-800"
            >
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> এলাকা / বিষয়
                </label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-7 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                >
                  <option value="all" className="text-slate-900">সকল ক্যাটাগরি</option>
                  {categories.map(cat => <option key={cat} value={cat} className="text-slate-900">{cat}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> সংগ্রহের ধরণ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'free', 'paid'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriceFilter(p)}
                      className={cn(
                        "py-4 rounded-xl text-[10px] font-black uppercase transition-all",
                        priceFilter === p ? "bg-white text-slate-900" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {p === 'all' ? 'সব' : p === 'free' ? 'লাইব্রেরি' : 'বিক্রয়'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-rose-400" /> সংগ্রহের অবস্থা
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['all', 'available', 'pre-order'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "py-4 rounded-xl text-[10px] font-black uppercase transition-all",
                        statusFilter === s ? "bg-white text-slate-900" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {s === 'all' ? 'সব' : s === 'available' ? 'অর্ডার' : 'আসন্ন'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Book Grid / Category Segments */}
      <div className="space-y-32">
        {activeTab === 'categories' || activeTab === 'all' ? (
          Object.entries(categoryGroups).map(([cat, catBooks], groupIdx) => (
            <section key={cat} className="group/section">
              <div className="flex justify-between items-end mb-6 px-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 group-hover/section:text-indigo-600 transition-colors uppercase tracking-tight">{cat}</h2>
                  <div className="w-12 h-1 bg-indigo-600 rounded-full group-hover/section:w-20 transition-all duration-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const el = document.getElementById(`scroll-${groupIdx}`);
                    el?.scrollBy({ left: -300, behavior: 'smooth' });
                  }} className="p-3 bg-white rounded-xl hover:bg-indigo-50 border border-slate-100 shadow-sm transition-all active:scale-90">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button onClick={() => {
                    const el = document.getElementById(`scroll-${groupIdx}`);
                    el?.scrollBy({ left: 300, behavior: 'smooth' });
                  }} className="p-3 bg-white rounded-xl hover:bg-indigo-50 border border-slate-100 shadow-sm transition-all active:scale-90">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="relative group/shelf">
                <div 
                  id={`scroll-${groupIdx}`}
                  className="flex overflow-x-auto gap-2 pb-10 pt-4 px-4 snap-x no-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {catBooks.map((book) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="min-w-[calc((100%-16px)/3)] sm:min-w-[calc((100%-24px)/4)] md:min-w-[calc((100%-32px)/5)] lg:min-w-[calc((100%-40px)/6)] xl:min-w-[calc((100%-40px)/6)] snap-start"
                    >
                      <div className="group/card bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all p-1.5 h-full flex flex-col hover:-translate-y-1 duration-300">
                        <div className="aspect-[3/4.2] relative overflow-hidden bg-slate-50 rounded-lg mb-2">
                          <img 
                            src={book.cover || 'https://placehold.co/400x600/eee/999?text=Cover+Not+Found'} 
                            alt={book.title}
                            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm",
                              book.isEBook ? "bg-indigo-600 text-white" : book.price !== '৳০' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                              {book.isEBook ? 'E-Book' : book.price !== '৳০' ? 'Sell' : 'Library'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="px-1 pb-1 flex flex-col flex-1">
                          <h3 className="text-[10px] sm:text-[11px] font-black text-slate-900 mb-0.5 line-clamp-2 leading-tight min-h-[1.8rem]">{book.title}</h3>
                          <p className="text-[8px] sm:text-[9px] text-slate-400 mb-3 font-bold truncate opacity-80">{book.author}</p>
                          
                          <div className="mt-auto flex items-center justify-between gap-1">
                             <div className="text-[9px] sm:text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                                {book.price === '৳০' ? 'Free' : book.price}
                             </div>
                             <button 
                               onClick={() => setSelectedBook(book)}
                               className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-indigo-600 transition-all active:scale-95"
                             >
                                <ArrowRight className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Enhanced Professional Shelf */}
                <div className="absolute bottom-6 left-2 right-2 h-2 bg-gradient-to-b from-slate-200 to-slate-100 rounded-full -z-10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border-b border-white" />
              </div>
            </section>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 px-4">
            {filteredBooks.map((book) => (
               <motion.div
                 key={book.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="group bg-white rounded-[45px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-3 hover:-translate-y-2 duration-500"
               >
                 <div className="aspect-[3/4.2] relative overflow-hidden bg-slate-100 rounded-[35px] mb-6">
                   <img src={book.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title} />
                 </div>
                 <div className="p-6">
                    <h3 className="text-xl font-black text-slate-900 mb-2">{book.title}</h3>
                    <p className="text-slate-400 font-bold mb-8 italic">{book.author}</p>
                    <button onClick={() => setSelectedBook(book)} className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black hover:bg-indigo-600 transition-all">বিস্তারিত</button>
                 </div>
               </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* No Results Fallback */}
      {filteredBooks.length === 0 && (
         <div className="text-center py-40 bg-slate-50 rounded-[80px] border-4 border-dashed border-slate-100">
            <Bookmark className="w-24 h-24 text-slate-200 mx-auto mb-8" />
            <p className="text-slate-400 font-black text-2xl uppercase tracking-widest">No books found in this dimension</p>
            <p className="text-slate-300 font-bold mt-4">Try adjusting your filters or search terms.</p>
         </div>
      )}

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative bg-white w-full max-w-3xl rounded-[50px] shadow-2xl overflow-hidden p-12"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <Plus className="w-8 h-8" />
                  </div>
                  নতুন বই যুক্ত করুন
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100">
                   <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">বইয়ের শিরোনাম</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">লেখকের নাম</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">বইয়ের বিভাগ (ক্যাটাগরি)</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">নির্ধারিত মূল্য</label>
                    <input 
                      type="text" 
                      placeholder="৳৪৫০ বা Free"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">কভার ইমেজ ডিরেক্ট লিংক</label>
                    <input 
                      type="url" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.cover}
                      onChange={(e) => setNewBook({...newBook, cover: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <input 
                      type="checkbox" 
                      id="isEBook_modal"
                      className="w-6 h-6 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      checked={newBook.isEBook}
                      onChange={(e) => setNewBook({...newBook, isEBook: e.target.checked})}
                    />
                    <label htmlFor="isEBook_modal" className="font-black text-indigo-900 text-sm">এটি একটি ডিজিটাল ই-বুক</label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-4"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    তালিকায় বই যুক্ত করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && !isAdded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSelectedBook(null)}
            />
            <motion.div
              layoutId={`book-details-${selectedBook.id}`}
              className="relative bg-white w-full max-w-5xl rounded-[60px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
            >
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-8 right-8 z-50 p-4 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-[40%] p-12 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] grayscale rotate-12 -translate-x-12">
                   <BarChart3 className="w-[400px] h-[400px]" />
                </div>
                {selectedBook.cover ? (
                  <img src={selectedBook.cover} className="w-full max-w-[300px] shadow-2xl rounded-2xl relative z-10" />
                ) : (
                  <div className="w-48 h-72 bg-white rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                    <BookOpen className="w-20 h-20 text-indigo-100" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-12 md:p-20 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center gap-4 mb-8">
                  <span className="px-5 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl uppercase tracking-widest">{selectedBook.category}</span>
                  {selectedBook.isEBook && (
                    <span className="px-5 py-2 bg-purple-50 text-purple-600 text-[10px] font-black rounded-xl uppercase tracking-widest">E-BOOK</span>
                  )}
                </div>

                <h2 className="text-4xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">{selectedBook.title}</h2>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Author / Writer</p>
                    <p className="text-xl font-bold text-slate-900">{selectedBook.author}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                      <span className="text-lg font-black text-slate-900">{selectedBook.status === 'available' ? 'Available Now' : 'Pre-Order Only'}</span>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Market Price</span>
                      <span className="text-lg font-black text-slate-900">{selectedBook.price || 'Free / Library'}</span>
                   </div>
                </div>

                {selectedBook.isEBook && (
                  <div className="mb-10 p-2 bg-purple-50 rounded-[40px] border border-purple-100">
                    {canAccessEBook ? (
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={selectedBook.ebookUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 py-6 bg-purple-600 text-white rounded-[32px] font-black hover:bg-slate-900 transition-all shadow-xl shadow-purple-100"
                        >
                          <Eye className="w-5 h-5" />
                          <span>অনলাইনে পড়ুন</span>
                        </a>
                        <a 
                          href={selectedBook.ebookUrl || '#'} 
                          download
                          className="flex items-center justify-center gap-3 py-6 bg-white border-2 border-purple-200 text-purple-600 rounded-[32px] font-black hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        >
                          <Download className="w-5 h-5" />
                          <span>ডাউনলোড</span>
                        </a>
                      </div>
                    ) : (
                      <div className="p-8 flex items-start gap-5">
                        <AlertCircle className="w-10 h-10 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-rose-900 font-black mb-2 text-lg">অ্যাক্সেস সংরক্ষিত!</p>
                          <p className="text-rose-600 text-sm font-bold leading-relaxed">
                            ই-বুক সুবিধার জন্য MBSTU অর্থনীতি বিভাগের (ব্যাচ ২০-২৫) সক্রিয় ভেরিফাইড ইমেইল প্রয়োজন।
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => handleAddToCart(selectedBook)}
                  className="w-full py-7 bg-indigo-600 text-white rounded-[35px] font-black flex items-center justify-center space-x-5 shadow-2xl shadow-indigo-100 hover:bg-slate-900 transition-all transform active:scale-95"
                >
                  <ShoppingCart className="w-8 h-8" />
                  <span className="text-2xl">কার্টে যোগ করুন (Order)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {isAdded && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-sm w-full">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                     <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">সফল হয়েছে!</h3>
                  <p className="text-slate-500 font-medium mb-10">বইটি আপনার কার্টে যুক্ত করা হয়েছে।</p>
                  <div className="space-y-4">
                     <button onClick={() => navigate('/cart')} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-lg">পেমেন্ট করুন</button>
                     <button onClick={() => setIsAdded(false)} className="w-full py-5 bg-slate-100 text-slate-600 rounded-3xl font-black">আরও বই দেখুন</button>
                  </div>
               </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
