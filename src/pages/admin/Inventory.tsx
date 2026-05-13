import { useState } from 'react';
import { 
  BookOpen, Search, Filter, 
  MoreVertical, Plus, Edit2, 
  Trash2, QrCode, ArrowUpRight,
  Bookmark, CheckCircle2, XCircle,
  Image as ImageIcon, X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const initialBooks = [
  { id: 'GEN-7618', title: 'কুফর তাকফির বিদআত-প্রান্তিকতা ও ভারসাম্য', author: 'মূল: শায়খ সালিহ আল ফাওযান', category: 'সাধারণ', stock: 5, status: 'Available', price: '৳১২০', cover: 'https://placehold.co/400x600/312e81/white?text=Takfir+Book' },
  { id: 'GEN-7669', title: 'নিভৃত নিভৃত নিভৃতে', author: 'ডঃ মুহাম্মদ ইসমাইল', category: 'প্রবন্ধ', stock: 2, status: 'Available', price: '৳১৫০', cover: 'https://placehold.co/400x600/10b981/white?text=Poem' },
  { id: 'POE-4613', title: 'ফেরার সময়', author: 'মোহাম্মদ মোতালেব', category: 'কবিতা', stock: 0, status: 'Lent Out', price: '৳১৮০', cover: 'https://placehold.co/400x600/f59e0b/white?text=Return' },
  { id: 'ISL-8062', title: 'নাম হাতে ধরা মনুশী নবা', author: 'ইমাম আল গাজ্জালী', category: 'ইসলামী বই', stock: 12, status: 'Available', price: '৳২৫০', cover: 'https://placehold.co/400x600/6366f1/white?text=Imam' },
];

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState(initialBooks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'সাধারণ',
    stock: 1,
    price: '',
    cover: ''
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `BOOK-${Math.floor(Math.random() * 9000) + 1000}`;
    setBooks([{ ...newBook, id, status: 'Available' }, ...books]);
    setIsModalOpen(false);
    setNewBook({ title: '', author: '', category: 'সাধারণ', stock: 1, price: '', cover: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বইয়ের তালিকা (Inventory)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">মোট {books.length}টি বই ক্যাটালগে আছে</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center justify-center space-x-3 px-6 py-4 bg-white border border-slate-200 rounded-[24px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <QrCode className="w-5 h-5" />
            <span>স্ক্যান করুন</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন বই যোগ করুন</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">নতুন বই যোগ করুন</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">বইয়ের নাম</label>
                    <input 
                      required
                      type="text" 
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">লেখকের নাম</label>
                    <input 
                      required
                      type="text" 
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ক্যাটাগরি</label>
                    <select 
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option>সাধারণ</option>
                      <option>উপন্যাস</option>
                      <option>কবিতা</option>
                      <option>ইসলামী বই</option>
                      <option>প্রবন্ধ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">মূল্য</label>
                    <input 
                      type="text" 
                      placeholder="৳২০০"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">কভার ইমেজ (URL)</label>
                  <div className="relative group">
                    <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="https://example.com/cover.jpg"
                      value={newBook.cover}
                      onChange={(e) => setNewBook({...newBook, cover: e.target.value})}
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {newBook.cover && (
                  <div className="mt-4 flex justify-center">
                    <img src={newBook.cover} alt="Cover Preview" className="h-40 w-28 object-cover rounded-xl shadow-lg" onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x600/eee/999?text=Invalid+URL')} />
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="বইয়ের নাম বা লেখকের নাম লিখুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
             <button className="flex items-center space-x-2 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600">
               <Filter className="w-4 h-4" />
               <span> ক্যাটাগরি</span>
             </button>
             <button className="flex items-center space-x-2 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600">
               <Bookmark className="w-4 h-4 text-indigo-500" />
               <span>অভেদ বই</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
          {books.map((book) => (
            <div key={book.id} className="p-8 hover:bg-slate-50/50 transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-24 bg-slate-100 rounded-xl overflow-hidden shadow-md group-hover:rotate-6 transition-transform flex items-center justify-center">
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button className="p-2 text-slate-300 hover:text-indigo-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-300 hover:text-rose-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-3 inline-block">
                  {book.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{book.title}</h3>
                <p className="text-xs font-bold text-slate-500 mb-4">{book.author}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">ষ্টক</span>
                    <span className="text-sm font-black text-slate-900">{book.stock} টি</span>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "flex items-center text-[10px] font-black uppercase tracking-wider mb-0.5",
                      book.status === 'Available' ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {book.status === 'Available' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {book.status}
                    </span>
                    <span className="text-xs font-black text-indigo-600">{book.price}</span>
                  </div>
                </div>
              </div>
              
              <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/20 text-center">
          <button className="px-10 py-4 bg-white border border-slate-200 rounded-3xl font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl transition-all group">
            আরও বই দেখুন
            <ArrowUpRight className="inline-block ml-2 w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
