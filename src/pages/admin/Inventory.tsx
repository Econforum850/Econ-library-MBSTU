import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, 
  MoreVertical, Plus, Edit2, 
  Trash2, QrCode, ArrowUpRight,
  Bookmark, CheckCircle2, XCircle,
  ImageIcon, X, Loader2, AlertTriangle,
  RefreshCw, FileText, Download, Eye, LayoutGrid, List as ListIcon,
  Package, DollarSign, HardDrive, Inbox
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, SupabaseBook } from '@/src/lib/supabaseDatabase';

interface ExtendedBook extends SupabaseBook {}

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<ExtendedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [submitting, setSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [customScriptUrl, setCustomScriptUrl] = useState(localStorage.getItem('script_url') || 'https://script.google.com/macros/s/AKfycbyt-HKZBQZ3WWQ5tJ-S5GmVY-wyi2OPRNPHyXFGjMuux5SrhN1ywTX_SlR8yocdC3Z-jQ/exec');

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'সাধারণ',
    stock: 1,
    price: '',
    cover: '',
    isEBook: false,
    ebookUrl: '',
    bookId: '',
    shelfNo: 'N/A'
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      const allBooks = await db.getBooks();
      setBooks(allBooks);
      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

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

  const handleEditClick = (book: ExtendedBook) => {
    setEditingBookId(book.id);
    setNewBook({
      title: book.title || '',
      author: book.author || '',
      category: book.category || 'সাধারণ',
      stock: book.stock || 1,
      price: book.price || '',
      cover: book.cover || '',
      isEBook: !!book.isEBook,
      ebookUrl: book.ebookUrl || '',
      bookId: book.bookId || '',
      shelfNo: book.shelfNo || 'N/A'
    });
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${bookTitle}" ক্যাটালগ থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    setLoading(true);
    try {
      await db.deleteBook(bookId);
      alert('বইটি সফলভাবে মুছে ফেলা হয়েছে!');
      loadBooks();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('বইটি মুছতে কোনো সমস্যা হয়েছে:\n' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const bookData: any = {
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        stock: newBook.stock,
        price: newBook.price || '৳০',
        cover: newBook.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
        isEBook: newBook.isEBook,
        ebookUrl: newBook.isEBook ? newBook.ebookUrl : '',
        bookId: newBook.bookId || `ID-${Math.floor(Math.random() * 1000)}`,
        shelfNo: newBook.shelfNo || 'N/A',
        status: 'available'
      };

      if (editingBookId) {
        bookData.id = editingBookId;
        await db.saveBook(bookData);
        alert('বইটি ক্যাটালগে সফলভাবে আপডেট করা হয়েছে!');
      } else {
        await db.saveBook(bookData);
        alert('বইটি ক্যাটালগে সফলভাবে যুক্ত করা হয়েছে!');
      }

      setIsModalOpen(false);
      setEditingBookId(null);
      setNewBook({
        title: '', author: '', category: 'সাধারণ', stock: 1, price: '',
        cover: '', isEBook: false, ebookUrl: '', bookId: '', shelfNo: 'N/A'
      });
      loadBooks();
    } catch (err: any) {
      console.error('Save book error:', err);
      alert('বইটি সংরক্ষণ করতে সমস্যা হয়েছে:\n' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.bookId && book.bookId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [books, searchTerm]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Dynamic Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8"
        >
          <div>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Package className="w-3.5 h-3.5" />
              <span>ইভেন্টরি কন্ট্রোল</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2 font-sans tracking-tight">বইয়ের বিশাল ক্যাটালগ</h2>
            <p className="text-slate-500 font-bold max-w-md">মার্কেটপ্লেস ও লাইব্রেরির সকল বই এখন এক জায়গায়। স্টক ও ই-বুক কন্ট্রোল করুন সহজে।</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[40px] border border-slate-100 min-w-[200px]">
            <span className="text-5xl font-black text-indigo-600 font-mono tracking-tighter">{books.length}</span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">মোট কালেকশন</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 p-10 rounded-[50px] shadow-2xl flex flex-col justify-center gap-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
             <BookOpen className="w-32 h-32 text-white" />
          </div>
          <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">কুইক একশন</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black flex items-center justify-center space-x-3 shadow-xl hover:bg-indigo-500 hover:text-white transition-all active:scale-95 group relative z-10"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
            <span>নতুন বই যুক্ত করুন</span>
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="w-full py-5 bg-slate-800 text-slate-300 rounded-3xl font-black flex items-center justify-center space-x-3 hover:bg-slate-700 transition-all active:scale-95 z-10"
          >
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>সুপাবেজ ডাটাবেজ সেটআপ</span>
          </button>

          {showConfig && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="bg-slate-800 p-6 rounded-3xl space-y-4 border border-slate-700 text-left"
            >
               <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">সুপাবেজ টেবিল স্কিমা (PostgreSQL)</h4>
               <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                 আপনার Supabase Dashboard থেকে **SQL Editor** এ গিয়ে নিচের সম্পূর্ণ কোডটি পেস্ট করে **Run** বাটন প্রেস করুন:
               </p>
               <pre className="w-full bg-slate-950 p-4 rounded-xl text-[10px] text-emerald-400 font-mono overflow-x-auto border border-slate-900 select-all max-h-48 overflow-y-auto">
{`-- 1. Books Table
CREATE TABLE IF NOT EXISTS books (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  author text,
  category text,
  price text DEFAULT '৳০',
  cover text,
  "isEBook" boolean DEFAULT false,
  "ebookUrl" text,
  "bookId" text,
  "shelfNo" text DEFAULT 'N/A',
  status text DEFAULT 'available',
  stock integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  role text DEFAULT 'Member',
  join_date text,
  status text DEFAULT 'pending',
  dues numeric DEFAULT 0,
  photo text,
  address text,
  occupation text,
  password text DEFAULT 'password123',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Donors Table
CREATE TABLE IF NOT EXISTS donors (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  type text DEFAULT 'Individual',
  total_donation text DEFAULT '৳০',
  last_donation_date text,
  impact text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Issues Table
CREATE TABLE IF NOT EXISTS issues (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  book_title text NOT NULL,
  member_name text NOT NULL,
  issue_date text,
  due_date text,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Finances Table
CREATE TABLE IF NOT EXISTS finances (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  category text,
  amount numeric DEFAULT 0,
  date text,
  status text DEFAULT 'Completed',
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
               </pre>
               <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`-- 1. Books Table
CREATE TABLE IF NOT EXISTS books (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  author text,
  category text,
  price text DEFAULT '৳০',
  cover text,
  "isEBook" boolean DEFAULT false,
  "ebookUrl" text,
  "bookId" text,
  "shelfNo" text DEFAULT 'N/A',
  status text DEFAULT 'available',
  stock integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  role text DEFAULT 'Member',
  join_date text,
  status text DEFAULT 'pending',
  dues numeric DEFAULT 0,
  photo text,
  address text,
  occupation text,
  password text DEFAULT 'password123',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Donors Table
CREATE TABLE IF NOT EXISTS donors (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  type text DEFAULT 'Individual',
  total_donation text DEFAULT '৳০',
  last_donation_date text,
  impact text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Issues Table
CREATE TABLE IF NOT EXISTS issues (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  book_title text NOT NULL,
  member_name text NOT NULL,
  issue_date text,
  due_date text,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Finances Table
CREATE TABLE IF NOT EXISTS finances (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  category text,
  amount numeric DEFAULT 0,
  date text,
  status text DEFAULT 'Completed',
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`);
                    alert('SQL সফলভাবে ক্লিপবোর্ডে কপি করা হয়েছে!');
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all active:scale-95"
               >
                  কোড কপি করুন
               </button>
            </motion.div>
          )}

          <button 
            onClick={loadBooks}
            className="w-full py-5 bg-slate-800 text-slate-300 rounded-3xl font-black flex items-center justify-center space-x-3 hover:bg-slate-700 transition-all active:scale-95 z-10"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            <span>ডেটা সিঙ্ক করুন</span>
          </button>

          {isUsingSheet && books.length > 0 && (
            <button 
              type="button"
              onClick={async () => {
                if (!window.confirm('আপনি কি গুগল শিটের সকল বই সুপাবেজে ডেটাবেজে এক্সপোর্ট করতে চান?')) return;
                setLoading(true);
                try {
                  const booksToInsert = books.map(b => ({
                    title: b.title,
                    author: b.author,
                    category: b.category,
                    cover: b.cover || '',
                    bookId: b.bookId || `ID-${Math.floor(Math.random() * 1050)}`,
                    shelfNo: b.shelfNo || 'N/A',
                    status: 'available' as 'available' | 'pre-order',
                    price: b.price || '৳০',
                    stock: b.stock || 1,
                    isEBook: !!b.isEBook,
                    ebookUrl: b.ebookUrl || ''
                  }));

                  for (const book of booksToInsert) {
                    await db.saveBook(book);
                  }
                  alert('সকল বই সফলভাবে সুপাবেজে এক্সপোর্ট করা হয়েছে!');
                  loadBooks();
                } catch (e: any) {
                  console.error(e);
                  alert('এক্সপোর্ট করতে সমস্যা হয়েছে: ' + (e.message || e));
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black flex items-center justify-center space-x-3 hover:bg-emerald-700 transition-all active:scale-95 z-10 animate-pulse"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>শিটের বইসমূহ সুপাবেজে সেভ করুন</span>
            </button>
          )}
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-4 rounded-[40px] border border-white/20 shadow-sm sticky top-4 z-40">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="বই, লেখক বা ক্যাটাগরি..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[30px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
              onClick={() => setViewMode('list')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
             >
               <ListIcon className="w-5 h-5" />
             </button>
          </div>
          
          <button className="flex items-center space-x-2 px-6 py-4 bg-white border border-slate-200 rounded-[24px] text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
            <span>ফিল্টার</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
           <p className="text-slate-400 font-bold">সার্ভার থেকে ডেটা লোড হচ্ছে...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredBooks.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="text-center py-32 bg-white rounded-[50px] border border-slate-100"
            >
               <Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black text-lg">কোনো বই খুঁজে পাওয়া যায়নি</p>
               <p className="text-slate-400 text-sm font-bold">সার্চ টার্ম পরিবর্তন করে চেষ্টা করুন</p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  className="group bg-white rounded-[45px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-3 flex flex-col h-full"
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-[35px] bg-slate-50">
                    {book.cover ? (
                      <img src={book.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-200" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                       {book.isEBook ? (
                         <span className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black rounded-xl shadow-lg border border-purple-400">ই-বুক</span>
                       ) : (
                         <span className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-lg border border-emerald-400">লাইব্রেরি</span>
                       )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{book.category}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">{book.author}</p>
                    
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                       <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => handleEditClick(book)}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                             <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">ষ্টক</p>
                          <p className="text-sm font-black text-slate-900">{book.stock} টি</p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
            >
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50">
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">বই ও লেখক</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ক্যাটাগরি</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">অবস্থা</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">মূল্য ও স্টক</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-slate-50/30 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center space-x-6">
                                 <div className="w-12 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                    {book.cover ? (
                                      <img src={book.cover} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-300" /></div>
                                    )}
                                 </div>
                                 <div className="overflow-hidden">
                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{book.title}</p>
                                    <p className="text-xs font-bold text-slate-400 truncate">{book.author}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{book.category}</span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 {book.isEBook ? (
                                    <FileText className="w-4 h-4 text-purple-500" />
                                 ) : (
                                    <HardDrive className="w-4 h-4 text-emerald-500" />
                                 )}
                                 <span className={cn("text-xs font-black uppercase tracking-wider", book.isEBook ? "text-purple-600" : "text-emerald-600")}>
                                    {book.isEBook ? 'ই-বুক' : 'লাইব্রেরি'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="text-sm font-black text-slate-900">{book.price || '৳০'}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">ষ্টক: {book.stock || 0} টি</div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                 <button 
                                   type="button"
                                   onClick={() => handleEditClick(book)}
                                   className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                                 >
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                   type="button"
                                   onClick={() => handleDeleteBook(book.id, book.title)}
                                   className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Book Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden p-10 md:p-12 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4 font-sans tracking-tight">
                  <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Plus className="w-6 h-6" />
                  </div>
                  {editingBookId ? 'বইয়ের তথ্য আপডেট করুন' : 'নতুন বই যোগ করুন'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-4 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">বইয়ের নাম</label>
                    <input 
                      required
                      type="text" 
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">লেখকের নাম</label>
                    <input 
                      required
                      type="text" 
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">ক্যাটাগরি</label>
                    <select 
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                      <option>সাধারণ</option>
                      <option>উপন্যাস</option>
                      <option>কবিতা</option>
                      <option>ইসলামী বই</option>
                      <option>প্রবন্ধ</option>
                      <option>ই-বুক</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">স্টক ও আইডি</label>
                    <div className="flex gap-4">
                       <input 
                        type="number" 
                        placeholder="ষ্টক"
                        value={newBook.stock}
                        onChange={(e) => setNewBook({...newBook, stock: parseInt(e.target.value) || 0})}
                        className="w-24 px-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center"
                      />
                      <input 
                        type="text" 
                        placeholder="বুক আইডি"
                        value={newBook.bookId}
                        onChange={(e) => setNewBook({...newBook, bookId: e.target.value})}
                        className="flex-1 px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">মূল্য (যেমন: ৳৪৫০)</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="৳৪৫০"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">কভার ইমেজ (লিংক অথবা আপলোড করুন - ১ মেগাবাইটের কম)</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-200 text-slate-500 rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <input 
                        type="url" 
                        placeholder="কভার ইমেজ লিংক (যেমন: https://...)"
                        value={newBook.cover.startsWith('data:') ? '' : newBook.cover}
                        onChange={(e) => setNewBook({...newBook, cover: e.target.value})}
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500">অথবা ডিভাইস থেকে আপলোড করুন</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                    {newBook.cover && (
                      <div className="flex items-center gap-4 p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                        <img src={newBook.cover} alt="Preview" className="w-12 h-16 object-cover rounded-md shadow-sm" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">কভার ইমেজ প্রিভিউ</span>
                          <button type="button" onClick={() => setNewBook({...newBook, cover: ''})} className="text-xs text-rose-500 font-bold hover:underline">কভার রিমুভ করুন</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={cn("p-5 rounded-2xl transition-all", newBook.isEBook ? "bg-purple-100 text-purple-600 shadow-xl shadow-purple-100" : "bg-white text-slate-300 border border-slate-200")}>
                           <FileText className="w-7 h-7" />
                        </div>
                        <div>
                           <p className="font-black text-slate-900">এটি একটি ই-বুক?</p>
                           <p className="text-xs font-bold text-slate-400">অনলাইনে পড়ার ও ডাউনলোডের সুবিধা</p>
                        </div>
                     </div>
                     <button 
                      type="button"
                      onClick={() => setNewBook({...newBook, isEBook: !newBook.isEBook})}
                      className={cn(
                        "w-16 h-9 rounded-full transition-all relative outline-none",
                        newBook.isEBook ? "bg-purple-600" : "bg-slate-300"
                      )}
                     >
                       <div className={cn("absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all shadow-md", newBook.isEBook ? "right-1.5" : "left-1.5")} />
                     </button>
                  </div>
                  
                  {newBook.isEBook && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-3 pt-6 border-t border-slate-200 mt-4"
                    >
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">ই-বুক ডাউনলোড লিংক</label>
                      <input 
                        type="url" 
                        required={newBook.isEBook}
                        placeholder="Google Drive, Mega, Dropbox etc URL"
                        value={newBook.ebookUrl}
                        onChange={(e) => setNewBook({...newBook, ebookUrl: e.target.value})}
                        className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[30px] font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all text-sm"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-[32px] font-black hover:bg-slate-200 transition-all active:scale-95"
                  >
                    বাতিল করুন
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-6 bg-indigo-600 text-white rounded-[32px] font-black flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    <span>{submitting ? 'সংরক্ষণ করা হচ্ছে...' : (editingBookId ? 'তথ্য আপডেট করুন' : 'ক্যাটালগে যুক্ত করুন')}</span>
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
