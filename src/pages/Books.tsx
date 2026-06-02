import { Search, ChevronDown, BookOpen, Clock, X, User, CheckCircle2, Loader2, AlertCircle, Plus, Filter, FileText, Bookmark, ExternalLink, Download, Eye, TrendingUp, BarChart3, Globe, AlignLeft, ArrowRight, ArrowLeft, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { db } from '@/src/lib/supabaseDatabase';
import { defaultEconBooks } from '@/src/lib/defaultEconBooks';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  bookId: string;
  shelfNo: string;
  status: 'available' | 'pre-order';
  price?: string;
  stock?: number;
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
  const [lang, setLang] = useState<'BN' | 'EN'>('BN');
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'ebooks'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'pre-order'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowNotes, setBorrowNotes] = useState('');
  const [borrowPhone, setBorrowPhone] = useState('');
  const [borrowName, setBorrowName] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [importingBooks, setImportingBooks] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    const updateLang = () => {
      try {
        const stored = localStorage.getItem('preferred_lang') as 'BN' | 'EN';
        if (stored && (stored === 'BN' || stored === 'EN')) {
          setLang(stored);
        }
      } catch (_) {}
    };
    updateLang();
    window.addEventListener('storage', updateLang);
    const langInterval = setInterval(updateLang, 550);
    return () => {
      window.removeEventListener('storage', updateLang);
      clearInterval(langInterval);
    };
  }, []);

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
    ebookUrl: '',
    status: 'available' as 'available' | 'pre-order'
  });

  const loadAllBooks = async () => {
    try {
      setLoading(true);
      const allBooks = await db.getBooks();

      // De-duplicate by ID if necessary and mark eBooks based on category or price
      const processedBooks = allBooks.map(b => ({
        ...b,
        isEBook: b.category.toLowerCase().includes('e-book') || b.category.toLowerCase().includes('ই-বুক') || b.price === 'Free' || b.isEBook
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

  useEffect(() => {
    loadAllBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    let result = books.filter(book => 
      (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 'ebooks') {
      result = result.filter(b => b.isEBook);
    } else if (activeTab === 'categories' && selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    return result;
  }, [books, searchTerm, activeTab, selectedCategory, statusFilter]);

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

  const handleOpenBorrowModal = (book: Book) => {
    if (!loggedInUser) {
      navigate('/login?redirect=books');
      return;
    }
    if (loggedInUser.role !== 'Admin') {
      if (loggedInUser.status === 'pending') {
        alert('আপনার অ্যাকাউন্ট বর্তমানে পেন্ডিং রয়েছে। এডমিন এটি সক্রিয় করার আগে আপনি আবেদন করতে পারবেন না।');
        return;
      }
      if (loggedInUser.status === 'rejected') {
        alert('দুঃখিত, আপনার অ্যাকাউন্ট বাতিল (Rejected) করা হয়েছে। আপনি আবেদন করতে পারবেন না।');
        return;
      }
    }
    setBorrowName(loggedInUser.name || '');
    setBorrowPhone(loggedInUser.phone || '');
    setBorrowNotes('');
    setIsBorrowModalOpen(true);
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      setIsBorrowing(true);
      
      const newIssueData = {
        bookTitle: selectedBook.title,
        memberName: `${borrowName} (#${loggedInUser?.id || 'GUEST'})`,
        issueDate: new Date().toLocaleDateString('bn-BD'),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD'),
        status: 'Pending' as const,
        memberId: loggedInUser?.id || '',
        bookId: selectedBook.id,
        notes: borrowNotes,
        pickupDate: ''
      };

      await db.saveIssue(newIssueData);
      
      setIsBorrowModalOpen(false);
      setBorrowSuccess(true);
    } catch (err) {
      console.error('Failed to submit borrow request:', err);
      alert('আবেদন জমা দিতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('সতর্কতা: ফাইলের সাইজ ১ মেগাবাইটের (1MB) কম হতে হবে!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBook(prev => ({ ...prev, cover: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookData: any = {
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        price: newBook.price || '৳০',
        cover: newBook.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
        isEBook: newBook.isEBook,
        ebookUrl: newBook.ebookUrl || '',
        bookId: `ID-${Math.floor(Math.random() * 1000)}`,
        shelfNo: 'Pending',
        status: newBook.status || 'available',
        stock: 1
      };

      await db.saveBook(bookData);

      alert('বইটি সফলভাবে সুপাবেজে যুক্ত করা হয়েছে!');
      setShowAddModal(false);
      setNewBook({
        title: '',
        author: '',
        category: 'সাধারণ',
        price: '',
        cover: '',
        isEBook: false,
        description: '',
        ebookUrl: '',
        status: 'available'
      });
      loadAllBooks();
    } catch (err: any) {
      console.error('Failed to add book to Supabase:', err);
      alert('সুপাবেজে বইটি যুক্ত করতে নিচে উল্লেখিত ত্রুটি হয়েছে:\n' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-bold">{lang === 'BN' ? 'বইয়ের তালিকা লোড হচ্ছে...' : 'Loading Books Directory...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* HTML Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, footer, aside, button, .no-print, [role="tablist"], .bg-slate-50, select, input, .absolute, .mb-16.relative, .no-print-area {
            display: none !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .py-20 {
            padding-top: 10px !important;
            padding-bottom: 10px !important;
          }
          .space-y-32 {
            margin-top: 0 !important;
            space-y: 0 !important;
          }
          .space-y-32 > * + * {
            margin-top: 1.5rem !important;
          }
          .space-y-32 section {
            page-break-inside: avoid !important;
            margin-bottom: 25px !important;
          }
          /* Grid list printable layout for shelves flow */
          .overflow-x-auto {
            overflow: visible !important;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 15px !important;
            padding: 0 !important;
          }
          .no-scrollbar {
            scrollbar-width: auto !important;
            overflow: visible !important;
          }
          /* Card layouts matching clean printing boundaries */
          .group\\/card {
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 8px !important;
            height: auto !important;
            box-shadow: none !important;
            transform: none !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .group\\/card img {
            max-height: 140px !important;
            object-fit: contain !important;
            margin-bottom: 6px !important;
          }
          .snap-start {
            scroll-snap-align: none !important;
          }
          /* Hide shelf support styles & arrow indicators */
          .absolute.bottom-6.left-2.right-2 {
            display: none !important;
          }
          .flex.gap-2 {
            display: none !important;
          }
          .min-w-\\[calc\\(\\(100\\%-16px\\)\\/3\\)\\],
          .sm\\:min-w-\\[calc\\(\\(100\\%-24px\\)\\/4\\)\\],
          .md\\:min-w-\\[calc\\(\\(100\\%-32px\\)\\/5\\)\\],
          .lg\\:min-w-\\[calc\\(\\(100\\%-40px\\)\\/6\\)\\],
          .xl\\:min-w-\\[calc\\(\\(100\\%-40px\\)\\/6\\)\\] {
            min-width: 0 !important;
            width: 100% !important;
          }
        }
      ` }} />

      {/* Print-Only Structured Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 text-left">
        <h1 className="text-3xl font-black text-slate-900">
          {lang === 'BN' ? 'ডিপার্টমেন্ট অফ ইকোনমিক্স ডিজিটাল লাইব্রেরি ক্যাটালগ' : 'Department of Economics Digital Library Catalog'}
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1">
          {lang === 'BN' ? 'মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (MBSTU) • অর্থনীতি বিভাগ' : 'Mawlana Bhashani Science and Technology University (MBSTU) • Department of Economics'}
        </p>
        <div className="flex justify-between items-center mt-3 text-[10px] font-black text-slate-600 font-sans uppercase tracking-wider">
          <span>{lang === 'BN' ? `মোট ক্যাটালগ সংগ্রহ: ${books.length} টি বই` : `Total Catalog Collection: ${books.length} Books`}</span>
          <span>{lang === 'BN' ? `তারিখ: ${new Date().toLocaleDateString('bn-BD')}` : `Date: ${new Date().toLocaleDateString('en-US')}`}</span>
        </div>
      </div>

      {/* Modern Top Actions bar */}
      <div className="flex justify-between items-center mb-10 no-print">
        <button 
          type="button"
          onClick={() => window.print()}
          className="flex items-center space-x-2.5 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-[24px] font-black text-xs hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>{lang === 'BN' ? 'ক্যাটালগ প্রিন্ট করুন (A4 Sheet)' : 'Print Catalog (A4 Sheet)'}</span>
        </button>

        {isAdmin && (
          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3.5 bg-[#352df2] text-white rounded-[24px] font-black text-xs hover:bg-[#2018da] transition-all shadow-md active:scale-95 duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'BN' ? 'নতুন বই যুক্ত করুন' : 'Add New Book'}</span>
          </button>
        )}
      </div>

      {/* Header with modern economics aesthetic */}
      <div className="text-center mb-16 relative no-print">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/5 blur-[100px] -z-10 rounded-full" />
        <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8">
          <TrendingUp className="w-4 h-4" />
          <span>Research & Digital Archive</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 font-sans tracking-tight leading-[1.1]">
          {lang === 'BN' ? (
            <>বইয়ের <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">ডিজিটাল ক্যাটালগ</span></>
          ) : (
            <>Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">Book Catalog</span></>
          )}
        </h1>
        <p className="text-slate-550 max-w-2xl mx-auto text-lg leading-relaxed font-semibold">
          {lang === 'BN' 
            ? 'ডিপার্টমেন্ট অফ ইকোনমিক্স ডিজিটাল লাইব্রেরি। আপনার প্রয়োজনীয় ক্যাটালগটি খুঁজে নিন এবং সংগ্রহের সমৃদ্ধি বাড়ান।' 
            : 'Department of Economics Digital Library. Find your required books and elevate your knowledge archives.'}
        </p>
      </div>

      {/* Advanced Navigation & Categories */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10 px-4 no-print">
        {[
          { id: 'all', label: lang === 'BN' ? 'সকল সংগ্রহ' : 'All Collections', icon: BookOpen },
          { id: 'categories', label: lang === 'BN' ? 'বিভাগ অনুযায়ী' : 'By Categories', icon: Filter },
          { id: 'ebooks', label: lang === 'BN' ? 'ই-বুক আর্কাইভ' : 'E-Book Archive', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-3 px-10 py-5 rounded-[28px] font-black transition-all active:scale-95 group",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-slate-400")} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Streamlined Quick Category Discovery Pills */}
      <div className="max-w-5xl mx-auto mb-10 text-center no-print-area no-print">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5">
          {lang === 'BN' ? 'দ্রুত ক্যাটালগ আবিষ্কার করুন' : 'Quick Catalog Discovery'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => {
              setActiveTab('categories');
              setSelectedCategory('all');
            }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-black transition-all duration-200 active:scale-95 border",
              activeTab === 'categories' && selectedCategory === 'all'
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            {lang === 'BN' ? `সব বিষয় (${books.length})` : `All Subjects (${books.length})`}
          </button>
          {categories.map((cat) => {
            const count = books.filter(b => b.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab('categories');
                  setSelectedCategory(cat);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-black transition-all duration-200 active:scale-95 border",
                  activeTab === 'categories' && selectedCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Search & Filters Area */}
      <div className="max-w-4xl mx-auto mb-24 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder={lang === 'BN' ? "বইয়ের নাম, লেখক বা ক্যাটাগরি দিয়ে খুঁজুন..." : "Search by book title, author, category..."}
              className="w-full pl-20 pr-8 py-6 bg-white border-2 border-slate-200 rounded-[40px] focus:outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 focus:text-slate-800 transition-all shadow-xl font-bold text-lg text-slate-800 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-6 rounded-[35px] border border-slate-200 bg-white text-slate-500 transition-all shadow-xl active:scale-95 flex items-center justify-center hover:bg-slate-50",
                showFilters ? "bg-indigo-600 border-indigo-605 text-white" : ""
              )}
            >
              <Filter className="w-6 h-6" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10 bg-white rounded-[45px] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-10 border border-slate-200"
            >
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" /> {lang === 'BN' ? 'এলাকা / বিষয়' : 'Subject / Area'}
                </label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-7 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 font-sans cursor-pointer outline-none placeholder:text-slate-400"
                >
                  <option value="all">{lang === 'BN' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-rose-500" /> {lang === 'BN' ? 'সংগ্রহের অবস্থা' : 'Collection Status'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['all', 'available', 'pre-order'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "py-4 rounded-xl text-[10px] font-black uppercase transition-all",
                        statusFilter === s ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {s === 'all' ? (lang === 'BN' ? 'সব' : 'All') : s === 'available' ? (lang === 'BN' ? 'অর্ডার' : 'Available') : (lang === 'BN' ? 'আসন্ন' : 'Preorder')}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Book Grid / Category Segments */}
      <div className="space-y-6 md:space-y-8">
        {activeTab === 'categories' || activeTab === 'all' ? (
          Object.entries(categoryGroups).map(([cat, catBooks], groupIdx) => (
            <section key={cat} className="group/section">
              <div className="flex justify-between items-end mb-1 md:mb-1.5 px-4 font-display">
                <div className="space-y-0.5">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 group-hover/section:text-[#352df2] transition-colors uppercase tracking-tight">{cat}</h2>
                  <div className="w-8 h-0.5 bg-indigo-600 rounded-full group-hover/section:w-16 transition-all duration-500" />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => {
                    const el = document.getElementById(`scroll-${groupIdx}`);
                    el?.scrollBy({ left: -260, behavior: 'smooth' });
                  }} className="p-2 bg-white rounded-lg hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-90 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => {
                    const el = document.getElementById(`scroll-${groupIdx}`);
                    el?.scrollBy({ left: 260, behavior: 'smooth' });
                  }} className="p-2 bg-white rounded-lg hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-90 cursor-pointer">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="relative group/shelf">
                <div 
                  id={`scroll-${groupIdx}`}
                  className="flex overflow-x-auto gap-2.5 sm:gap-3.5 pb-4 pt-1.5 px-4 snap-x no-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {catBooks.map((book) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="min-w-[calc((100%-12px)/2.4)] sm:min-w-[calc((100%-24px)/4.2)] md:min-w-[calc((100%-32px)/5.2)] lg:min-w-[calc((100%-40px)/6.2)] xl:min-w-[calc((100%-40px)/6.5)] snap-start"
                    >
                      <div className="group/card bg-white/95 rounded-xl overflow-hidden border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(53,45,242,0.12)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 p-1.5 h-full flex flex-col">
                        <div className="aspect-[3/4] relative overflow-hidden bg-slate-100/80 rounded-lg mb-1.5 shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)]">
                          {/* Realistic Book 3D spine and bind highlighting */}
                          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10 rounded-l-lg pointer-events-none" />
                          <div className="absolute top-0 left-2 w-[1px] h-full bg-white/10 z-10 pointer-events-none" />
                          
                          <img 
                            src={book.cover || 'https://placehold.co/400x600/eee/999?text=Cover+Not+Found'}        
                            alt={book.title}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1.5 z-20">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[6.5px] md:text-[7px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1",
                              book.isEBook 
                                ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/20" 
                                : "bg-teal-950/80 text-teal-300 border-teal-500/20"
                            )}>
                              <span className={cn("w-1 h-1 rounded-full", book.isEBook ? "bg-indigo-400" : "bg-teal-400")} />
                              {book.isEBook ? 'E-Book' : 'Library'}
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[6.5px] md:text-[7px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1 transition-all",
                              ((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true))
                                ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/20"
                                : "bg-rose-950/85 text-rose-300 border-rose-500/20"
                            )}>
                              <span className={cn("w-1 h-1 rounded-full animate-pulse", ((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true)) ? "bg-emerald-400" : "bg-rose-400")} />
                              {((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true)) ? 'Available' : 'Not Available'}
                            </span>
                          </div>
                        </div>
                        <div className="px-1 pb-1 flex flex-col flex-1 text-left">
                          <h3 className="text-[10px] sm:text-[11px] font-black text-slate-800 group-hover/card:text-[#352df2] transition-colors mb-0.5 line-clamp-2 leading-tight min-h-[1.7rem]">{book.title}</h3>
                          <p className="text-[8px] sm:text-[9px] text-slate-500 mb-1.5 font-bold truncate opacity-85">{book.author}</p>
                          <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                            <span className="text-[8px] font-mono font-black text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                              {book.isEBook ? 'Digital' : 'Hardcopy'}
                            </span>
                            <button 
                              onClick={() => setSelectedBook(book)}
                              className="p-1 bg-[#352df2]/5 border border-[#352df2]/10 text-[#352df2] rounded hover:bg-[#352df2] hover:text-white hover:border-[#352df2] transition-all duration-300 active:scale-95 cursor-pointer"
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
                <div className="absolute bottom-1 left-2 right-2 h-1 bg-gradient-to-b from-slate-200 to-slate-100 rounded-full -z-10 shadow-[inner_0_1px_2px_rgba(0,0,0,0.1)] border-b border-white" />
              </div>
            </section>
          ))
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-4 px-4 text-left">
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="group/card bg-white/95 rounded-xl overflow-hidden border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(53,45,242,0.12)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 p-1.5 flex flex-col"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-100/80 rounded-lg mb-1.5 shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)]">
                  {/* Realistic Book 3D spine and bind highlighting */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10 rounded-l-lg pointer-events-none" />
                  <div className="absolute top-0 left-2 w-[1px] h-full bg-white/10 z-10 pointer-events-none" />

                  <img 
                    src={book.cover || 'https://placehold.co/400x600/eee/999?text=Cover+Not+Found'}        
                    alt={book.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1.5 z-20">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[6.5px] md:text-[7px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1",
                      book.isEBook 
                        ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/20" 
                        : "bg-teal-950/80 text-teal-300 border-teal-500/20"
                    )}>
                      <span className={cn("w-1 h-1 rounded-full", book.isEBook ? "bg-indigo-400" : "bg-teal-400")} />
                      {book.isEBook ? (lang === 'BN' ? 'ই-বুক' : 'E-Book') : (lang === 'BN' ? 'লাইব্রেরি' : 'Library')}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[6.5px] md:text-[7px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1 transition-all",
                      ((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true))
                        ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/20"
                        : "bg-rose-950/85 text-rose-300 border-rose-500/20"
                    )}>
                      <span className={cn("w-1 h-1 rounded-full animate-pulse", ((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true)) ? "bg-emerald-400" : "bg-rose-400")} />
                      {((book.status === 'available' || !book.status) && (book.stock !== undefined ? book.stock > 0 : true)) ? (lang === 'BN' ? 'অ্যাভেলেবল' : 'Available') : (lang === 'BN' ? 'অনুপলব্ধ (নিঃশেষ)' : 'Not Available')}
                    </span>
                  </div>
                </div>
                <div className="px-1 pb-1 flex flex-col flex-1">
                  <h3 className="text-[10px] sm:text-[11px] font-black text-slate-800 group-hover/card:text-[#352df2] transition-colors mb-0.5 line-clamp-2 leading-tight min-h-[1.7rem]">{book.title}</h3>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 mb-1.5 font-bold truncate opacity-85">{book.author}</p>
                  <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 w-full">
                    <span className="text-[8px] font-mono font-black text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                      {book.isEBook ? (lang === 'BN' ? 'ডিজিটাল' : 'Digital') : (lang === 'BN' ? 'হার্ডকপি' : 'Hardcopy')}
                    </span>
                    <button 
                      onClick={() => setSelectedBook(book)}
                      className="px-2.5 py-1 bg-[#352df2]/5 border border-[#352df2]/10 text-[#352df2] rounded hover:bg-[#352df2] hover:text-white hover:border-[#352df2] transition-all duration-300 text-[9px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{lang === 'BN' ? 'বিস্তারিত' : 'Details'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* No Results Fallback */}
      {filteredBooks.length === 0 && (
         <div className="text-center py-24 px-6 bg-slate-50/60 rounded-[80px] border-4 border-dashed border-slate-200 max-w-4xl mx-auto">
            <Bookmark className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <p className="text-slate-800 font-extrabold text-2xl mb-3">{lang === 'BN' ? 'ক্যাটালগ বর্তমানে খালি রয়েছে' : 'Catalog is currently empty'}</p>
            <p className="text-slate-550 font-medium max-w-lg mx-auto text-sm leading-relaxed mb-8">
              {lang === 'BN' ? 'লাইব্রেরি ক্যাটালগটি বর্তমানে খালি রয়েছে। কোনো বই খুঁজে পাওয়া যায়নি।' : 'The library catalog is currently empty. No book listings could be located.'}
            </p>
            
            {isAdmin ? (
              <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-md border border-slate-100">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">{lang === 'BN' ? 'অ্যাডমিন অ্যাকশন প্যানেল' : 'Admin Action Panel'}</p>
                <button 
                  type="button"
                  disabled={importingBooks}
                  onClick={async () => {
                    if (!window.confirm(lang === 'BN' ? 'আপনি কি সুপাবেজ লাইব্রেরি ডাটাবেজে ১০০টি রিয়ালিস্টিক অর্থনীতি বই (১০টি সেকশন বা ক্যাটাগরিতে বিভক্ত) যুক্ত করতে চান? এটি করতে কয়েক সেকেন্ড সময় লাগতে পারে।' : 'Do you want to import 100 realistic Economics books?')) return;
                    setImportingBooks(true);
                    setImportProgress(0);
                    try {
                      let successCount = 0;
                      for (let i = 0; i < defaultEconBooks.length; i++) {
                        const book = defaultEconBooks[i];
                        await db.saveBook({
                          title: book.title,
                          author: book.author,
                          category: book.category,
                          cover: book.cover,
                          bookId: book.bookId,
                          shelfNo: book.shelfNo,
                          status: book.status as 'available' | 'pre-order',
                          price: book.price,
                          stock: book.stock,
                          isEBook: book.isEBook,
                          ebookUrl: book.ebookUrl || ''
                        });
                        successCount++;
                        setImportProgress(Math.round(((i + 1) / defaultEconBooks.length) * 100));
                      }

                      // Append any newly imported categories to standard list
                      const savedCats = localStorage.getItem('econ_library_categories');
                      let cats = [
                        'সাধারণ', 'উপন্যাস', 'কবিতা', 'ইসলামী বই', 'প্রবন্ধ', 'ই-বুক',
                        'Microeconomics (ব্যষ্টিগত অর্থনীতি)', 'Macroeconomics (সমষ্টিগত অর্থনীতি)',
                        'Econometrics (ইকোনোমেট্রিক্স)', 'Development Economics (উন্নয়ন অর্থনীতি)'
                      ];
                      if (savedCats) {
                        try { cats = JSON.parse(savedCats); } catch(e) {}
                      }
                      const importedCats = Array.from(new Set(defaultEconBooks.map(b => b.category)));
                      const updatedCats = Array.from(new Set([...cats, ...importedCats]));
                      localStorage.setItem('econ_library_categories', JSON.stringify(updatedCats));

                      alert(lang === 'BN' ? 'সফলভাবে ১০০টি অর্থনীতি বিষয়ক বই যুক্ত করা হয়েছে!' : '100 economics books added successfully!');
                      loadAllBooks();
                    } catch (e: any) {
                      console.error('Import econ books error:', e);
                      alert(lang === 'BN' ? `বইসমূহ যুক্ত করতে সমস্যা হয়েছে: ` + (e.message || e) : 'Failed to import books: ' + (e.message || e));
                    } finally {
                      setImportingBooks(false);
                    }
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {importingBooks ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'BN' ? `আপলোড হচ্ছে (${importProgress}%)` : `Uploading (${importProgress}%)`}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>{lang === 'BN' ? '১০০টি অর্থনীতি বই যুক্ত করুন' : 'Import 100 Economics Books'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="inline-block px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-700">
                {lang === 'BN' 
                  ? 'অ্যাডমিন অ্যাকাউন্ট বা এডমিন ড্যাশবোর্ড থেকে বই সিঙ্ক/আপলোড করুন। আপনার ডিফল্ট এডমিনে লগইন করুন (Email: eco24034@mbstu.ac.bd অথবা অ্যাডমিন পাসওয়ার্ড দিয়ে)।' 
                  : 'Sync or upload books from your Admin dashboard. Please log in to your default Admin account (Email: eco24034@mbstu.ac.bd or using Admin password).'}
              </div>
            )}
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
                  {lang === 'BN' ? 'নতুন বই যুক্ত করুন' : 'Add New Book'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100">
                   <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'বইয়ের শিরোনাম' : 'Book Title'}</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'লেখকের নাম' : 'Author Name'}</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'বইয়ের বিভাগ (ক্যাটাগরি)' : 'Category / Department'}</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'নির্ধারিত মূল্য' : 'Book Retail Price'}</label>
                    <input 
                      type="text" 
                      placeholder={lang === 'BN' ? '৳৪৫০ বা Free' : '৳450 or Free'}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'কভার ইমেজ (লিংক বা আপলোড করুন - ১ মেগাবাইটের কম)' : 'Book Cover Image (Link or Upload - <1MB)'}</label>
                    <div className="space-y-3">
                      <input 
                        type="url" 
                        placeholder={lang === 'BN' ? "কভার ইমেজ ডিরেক্ট লিংক (যেমন: https://...)" : "Cover image Direct Link (e.g. https://...)"}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-sm"
                        value={newBook.cover.startsWith('data:') ? '' : newBook.cover}
                        onChange={(e) => setNewBook({...newBook, cover: e.target.value})}
                      />
                      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <span className="text-xs font-bold text-slate-500">{lang === 'BN' ? 'অথবা ডিভাইস থেকে আপলোড করুন' : 'Or upload cover from device'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {newBook.cover && (
                        <div className="flex items-center gap-4 p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                          <img src={newBook.cover} alt="Preview" className="w-12 h-16 object-cover rounded-md shadow-sm" />
                          <div className="flex-1">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">{lang === 'BN' ? 'কভার ইমেজ প্রিভিউ' : 'Cover Image Preview'}</span>
                            <button type="button" onClick={() => setNewBook({...newBook, cover: ''})} className="text-xs text-rose-500 font-bold hover:underline">{lang === 'BN' ? 'কভার রিমুভ করুন' : 'Remove Cover'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'BN' ? 'সংগ্রহের অবস্থা (Status)' : 'Availability Status'}</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-sm cursor-pointer"
                      value={newBook.status}
                      onChange={(e) => setNewBook({...newBook, status: e.target.value as any})}
                    >
                      <option value="available">Available ({lang === 'BN' ? 'অ্যাভেলেবল' : 'Available'})</option>
                      <option value="pre-order">Pre-order ({lang === 'BN' ? 'প্রি-অর্ডার' : 'Pre-order'})</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <input 
                      type="checkbox" 
                      id="isEBook_modal"
                      className="w-6 h-6 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      checked={newBook.isEBook}
                      onChange={(e) => setNewBook({...newBook, isEBook: e.target.checked})}
                    />
                    <label htmlFor="isEBook_modal" className="font-black text-indigo-900 text-sm">{lang === 'BN' ? 'এটি একটি ডিজিটাল ই-বুক' : 'This is a Digital E-Book'}</label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-4"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    {lang === 'BN' ? 'তালিকায় বই যুক্ত করুন' : 'Add Book to Catalog'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && (
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
                  <img src={selectedBook.cover} className="w-full max-w-[300px] shadow-2xl rounded-2xl relative z-10" alt="Cover" />
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'BN' ? 'লেখক / অনুবাদক' : 'Author / Translator'}</p>
                    <p className="text-xl font-bold text-slate-900">{selectedBook.author}</p>
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{lang === 'BN' ? 'স্ট্যাটাস / অবস্থা' : 'Availability Status'}</span>
                      <span className="text-lg font-black text-slate-900 font-sans">
                        {((selectedBook.status === 'available' || !selectedBook.status) && (selectedBook.stock !== undefined ? selectedBook.stock > 0 : true))
                          ? (lang === 'BN' ? 'অ্যাভেলেবল আছেন' : 'Available Now') 
                          : (lang === 'BN' ? 'অনুপলব্ধ / নিঃশেষ' : 'Not Available (Out of Stock)')}
                      </span>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{lang === 'BN' ? 'বইয়ের ধরন' : 'Book Type'}</span>
                      <span className="text-lg font-black text-slate-900">
                        {selectedBook.isEBook 
                          ? (lang === 'BN' ? 'ডিজিটাল ই-বুক' : 'Digital E-Book') 
                          : (lang === 'BN' ? 'লাইব্রেরি হার্ডকপি' : 'Library Hardcopy')}
                      </span>
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
                          <span>{lang === 'BN' ? 'অনলাইনে পড়ুন' : 'Read Online'}</span>
                        </a>
                        <a 
                          href={selectedBook.ebookUrl || '#'} 
                          download
                          className="flex items-center justify-center gap-3 py-6 bg-white border-2 border-purple-200 text-purple-600 rounded-[32px] font-black hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        >
                          <Download className="w-5 h-5" />
                          <span>{lang === 'BN' ? 'ডাউনলোড' : 'Download'}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="p-8 flex items-start gap-5">
                        <AlertCircle className="w-10 h-10 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-rose-900 font-black mb-2 text-lg">{lang === 'BN' ? 'অ্যাক্সেস সংরক্ষিত!' : 'Access Restricted!'}</p>
                          <p className="text-rose-600 text-sm font-bold leading-relaxed">
                            {lang === 'BN' 
                              ? 'ই-বুক সুবিধার জন্য MBSTU অর্থনীতি বিভাগের (ব্যাচ ২০-২৫) সক্রিয় ভেরিফاید ইমেইল প্রয়োজন।' 
                              : 'Access to Digital E-Books is reserved exclusively for verified, active MBSTU Economics students (Batch 20-25).'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!selectedBook.isEBook && (
                  <button 
                    disabled={!((selectedBook.status === 'available' || !selectedBook.status) && (selectedBook.stock !== undefined ? selectedBook.stock > 0 : true))}
                    onClick={() => handleOpenBorrowModal(selectedBook)}
                    className={cn(
                      "w-full py-7 text-white rounded-[35px] font-black flex items-center justify-center space-x-5 shadow-2xl transition-all transform duration-200",
                      ((selectedBook.status === 'available' || !selectedBook.status) && (selectedBook.stock !== undefined ? selectedBook.stock > 0 : true))
                        ? "bg-indigo-600 hover:bg-slate-900 shadow-indigo-100 active:scale-95 animate-pulse cursor-pointer"
                        : "bg-slate-300 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    <BookOpen className="w-8 h-8 text-indigo-300" />
                    <span className="text-2xl">
                      {((selectedBook.status === 'available' || !selectedBook.status) && (selectedBook.stock !== undefined ? selectedBook.stock > 0 : true))
                        ? (lang === 'BN' ? 'ধার নেওয়ার আবেদন (Borrow)' : 'Request Book Loan (Borrow)')
                        : (lang === 'BN' ? 'দুঃখিত, স্টক নিঃশেষ' : 'Out of Stock / Not Available')}
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Borrow Request Confirmation Modal */}
      <AnimatePresence>
        {isBorrowModalOpen && selectedBook && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsBorrowModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white p-8 md:p-10 rounded-[40px] shadow-2xl text-left max-w-lg w-full overflow-hidden border border-slate-100"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                <span>{lang === 'BN' ? 'বই ধার নেওয়ার আবেদন' : 'Request Book Loan'}</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">
                {lang === 'BN' ? 'ডিপার্টমেন্টাল লাইব্রেরি বই ইস্যুর তথ্যসমূহ' : 'Departmental Library Book Issue Details'}
              </p>
              
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-6 flex gap-3 text-xs text-slate-600 leading-relaxed">
                <img src={selectedBook.cover || ''} alt={selectedBook.title} className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                <div>
                  <h4 className="font-extrabold text-indigo-900 text-sm line-clamp-1">{selectedBook.title}</h4>
                  <p className="font-bold text-slate-400 mt-0.5">{selectedBook.author}</p>
                </div>
              </div>

              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'BN' ? 'আবেদনকারীর নাম' : "Applicant's Name"}</label>
                  <input 
                    type="text" 
                    required 
                    value={borrowName} 
                    onChange={(e) => setBorrowName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'BN' ? 'যোগাযোগের মোবাইল নম্বর' : 'Contact Mobile Number'}</label>
                  <input 
                    type="tel" 
                    required 
                    value={borrowPhone} 
                    onChange={(e) => setBorrowPhone(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'BN' ? 'মন্তব্য বা উদ্দেশ্য (Optional Notes/Purpose)' : 'Purpose Notes (Optional)'}</label>
                  <textarea 
                    placeholder={lang === 'BN' ? "কোন্ উদ্দেশ্যে বইটি প্রয়োজন বা ব্যবহারের সময়কাল সম্পর্কে সংক্ষেপে লিখতে পারেন..." : "Briefly mention study duration or study purpose..."} 
                    value={borrowNotes} 
                    onChange={(e) => setBorrowNotes(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 leading-relaxed">
                  {lang === 'BN' 
                    ? '💡 আবেদন সফল করার পর অ্যাডমিন রিভিউ করে বইটি সংগ্রহের জন্য একটি নির্দিষ্ট তারিখ ও বেলা সময় নির্ধারণ করে দেবেন। আপনি আপনার প্রোফাইলের "বর্তমানের আবেদন" ট্যাব থেকে সংগ্রহ সময় পরিলক্ষণ করতে পারবেন।' 
                    : '💡 After successful request submission, the admin will review and schedule a pickup time. You can monitor the scheduled collection date in your account profile dashboard.'}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsBorrowModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">{lang === 'BN' ? 'বাতিল' : 'Cancel'}</button>
                  <button type="submit" disabled={isBorrowing} className="px-8 py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-150 flex items-center justify-center gap-2">
                    {isBorrowing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{lang === 'BN' ? 'প্রক্রিয়াধীন...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <span>{lang === 'BN' ? 'আবেদন নিশ্চিত করুন' : 'Confirm Request'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Borrow Success Toast Modal */}
      <AnimatePresence>
        {borrowSuccess && (
          <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-sm w-full">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
                   <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black mb-4">আবেদন সফল হয়েছে!</h3>
                <p className="text-slate-500 text-sm font-bold mb-10 leading-relaxed">বইটি ধার নেওয়ার আবেদন সফলভাবে এডমিন প্যানেলে পৌঁছেছে। সংগ্রহের শিডিউল জানতে প্রোফাইল চেক করুন।</p>
                <div className="space-y-3">
                   <button onClick={() => { setBorrowSuccess(false); navigate('/account'); }} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-lg">প্রোফাইল দেখুন</button>
                   <button onClick={() => setBorrowSuccess(false)} className="w-full py-5 bg-slate-100 text-slate-605 rounded-3xl font-black">ঠিক আছে</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
