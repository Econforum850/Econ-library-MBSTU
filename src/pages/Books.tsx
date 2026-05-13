import { Search, ChevronDown, BookOpen, Clock, X, ShoppingCart, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  bookId: string;
  shelfNo: string;
  status: 'available' | 'pre-order';
}

const CATEGORIES = [
  { 
    id: 'islamic', 
    name: 'ইসলামী বই', 
    books: [
      { id: '1', title: 'কুফর তাকফির বিদআত-প্রান্তিকতা ও ভারসাম্য', author: 'মূল: শায়খ সালিহ আল ফাওযান', category: 'সাধারণ', cover: 'https://placehold.co/400x600/312e81/white?text=Takfir+Book', bookId: 'GEN-7618', shelfNo: 'N/A', status: 'pre-order' },
      { id: '2', title: 'তাফসীর ইবন কাসীর (১০-১১) খণ্ড', author: 'হাফিজ ইমাদউদ্দীন ইবন কাসীর (র)', category: 'ইসলামী বই', cover: 'https://placehold.co/400x600/1e3a8a/white?text=Tafsir', bookId: 'ISL-102', shelfNo: 'A-2', status: 'pre-order' },
      { id: '3', title: 'বিশ্বায়নের যুগে ইসলাম উম্মাহ এবং সভ্যতা', author: 'প্রফেসর ড. মুহাম্মদ সালাহ', category: 'সাধারণ', cover: 'https://placehold.co/400x600/1e40af/white?text=Islam', bookId: 'ISL-505', shelfNo: 'B-1', status: 'pre-order' },
      { id: '4', title: 'তাকফীর ইবন কাসীর', author: 'ইবন কাসীর (র)', category: 'ধর্মীয়', cover: 'https://placehold.co/400x600/1d4ed8/white?text=Takfir', bookId: 'ISL-202', shelfNo: 'A-5', status: 'pre-order' },
    ]
  },
  { 
    id: 'science-fiction', 
    name: 'সায়েন্স ফিকশন', 
    books: [
      { id: '5', title: 'সায়েন্স ফিকশন সবুজ মানব', author: 'হুমায়ূন আহমেদ', category: 'সায়েন্স ফিকশন', cover: 'https://placehold.co/400x600/065f46/white?text=Sci-Fi', bookId: 'SF-101', shelfNo: 'S-4', status: 'pre-order' },
      { id: '6', title: 'রোবটিক্স ও মহাকাশ', author: 'মুহম্মদ জাফর ইকবাল', category: 'বিজ্ঞান', cover: 'https://placehold.co/400x600/047857/white?text=Robotics', bookId: 'SCI-404', shelfNo: 'S-6', status: 'pre-order' },
      { id: '7', title: 'অ্যানোমালি', author: 'অজানা লেখন', category: 'সায়েন্স ফিকশন', cover: 'https://placehold.co/400x600/059669/white?text=Anomaly', bookId: 'SF-999', shelfNo: 'S-2', status: 'pre-order' },
    ]
  },
  { 
    id: 'literature', 
    name: 'সাহিত্য ও উপন্যাস', 
    books: [
      { id: '8', title: 'সাতকাহন (অখণ্ড)', author: 'সমরেশ মজুমদার', category: 'সাধারণ', cover: 'https://placehold.co/400x600/4c1d95/white?text=Satkahon', bookId: 'LIT-888', shelfNo: 'L-1', status: 'pre-order' },
      { id: '9', title: 'বিবিধ রচনাবলী', author: 'শরৎচন্দ্র চট্টোপাধ্যায়', category: 'প্রবন্ধ', cover: 'https://placehold.co/400x600/5b21b6/white?text=Literature', bookId: 'LIT-111', shelfNo: 'L-5', status: 'pre-order' },
      { id: '10', title: 'ভালোবাসার নীল পদ্ম', author: 'ইমদাদুল হক মিলন', category: 'উপন্যাস', cover: 'https://placehold.co/400x600/6d28d9/white?text=Novel', bookId: 'NOV-303', shelfNo: 'L-3', status: 'pre-order' },
    ]
  }
];

export default function Books() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem, totalItems } = useCart();
  const navigate = useNavigate();

  const handlePreOrder = (book: Book) => {
    setSelectedBook(book);
    setIsAdded(false);
  };

  const handleAddToCart = () => {
    if (selectedBook) {
      addItem({
        id: selectedBook.id,
        title: selectedBook.title,
        price: 0, // Pre-order might not have a price yet or it's handled differently
        quantity: 1,
        cover: selectedBook.cover,
      });
      setIsAdded(true);
    }
  };

  const handleGoToPayment = () => {
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16 px-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 drop-shadow-sm">বই সংগ্রহশালা</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">লাইব্রেরির সকল বইয়ের সংগ্রহ অনলাইনে থেকে দেখে নিন এবং আপনার পছন্দের বইটি প্রিবুক করুন।</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-20 items-center max-w-5xl mx-auto px-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="বইয়ের নাম বা লেখক দিয়ে খুঁজুন..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[30px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-3 px-8 py-5 bg-white border border-slate-200 rounded-[30px] text-slate-700 font-bold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm">
          <span>সকল বিভাগ</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Segments */}
      <div className="space-y-24">
        {CATEGORIES.map((category) => (
          <section key={category.id} className="relative">
            <div className="flex items-center justify-between mb-10 px-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h2 className="text-3xl font-black text-slate-900">{category.name}</h2>
              </div>
              <button className="text-indigo-600 font-bold text-sm hover:underline">সবগুলো দেখুন →</button>
            </div>
            
            <div className="flex overflow-x-auto pb-12 px-4 gap-8 scrollbar-hide snap-x no-scrollbar">
              {category.books.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group snap-start p-3"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 rounded-[40px]">
                    <img 
                      src={book.cover} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Enhanced Status Badge */}
                    <div className={cn(
                      "absolute top-5 right-5 px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl backdrop-blur-md flex items-center space-x-2 border border-white/20 transition-transform group-hover:scale-110",
                      book.status === 'available' 
                        ? "bg-emerald-500/90 text-white" 
                        : "bg-amber-500/90 text-white"
                    )}>
                      {book.status === 'available' ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span className="tracking-widest uppercase">
                        {book.status === 'available' ? 'এভেইলবল' : 'প্রি-অর্ডার'}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.25em] mb-4 block">{book.category}</span>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                    <p className="text-sm text-slate-400 mb-8 line-clamp-1 font-medium">{book.author}</p>
                    
                    <button 
                      onClick={() => handlePreOrder(book as Book)}
                      className="mt-auto w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black flex items-center justify-center space-x-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 active:scale-95 group-hover:shadow-indigo-200"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>প্রি-অর্ডার করুন</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Book Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSelectedBook(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white w-full max-w-4xl rounded-[60px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
            >
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-8 right-8 z-10 p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full md:w-[45%] p-12 bg-slate-50 flex items-center justify-center">
                <motion.img 
                  layoutId={`book-${selectedBook.id}`}
                  src={selectedBook.cover} 
                  className="w-full max-w-[280px] shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl"
                />
              </div>

              <div className="flex-1 p-12 md:p-16 lg:p-20 relative">
                <div className="flex items-center space-x-3 mb-8">
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl">সাধারণ</span>
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>এভেইলবল</span>
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">
                  {selectedBook.title}
                </h2>

                <div className="flex items-center space-x-3 mb-10">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                   </div>
                   <p className="text-slate-500 font-bold text-sm">মূল: <span className="text-slate-900">{selectedBook.author}</span></p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-16">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">বই কোড</span>
                    <span className="text-[11px] font-black text-slate-900">{selectedBook.bookId}</span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">সেল্ফ নং</span>
                    <span className="text-[11px] font-black text-slate-900">{selectedBook.shelfNo}</span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">ক্যাটাগরি</span>
                    <span className="text-[11px] font-black text-slate-900">{selectedBook.category}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  {!isAdded ? (
                    <button 
                      onClick={handleAddToCart}
                      className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black flex items-center justify-center space-x-4 shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98] group"
                    >
                      <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-xl">কার্টে যোগ করুন</span>
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-center space-x-3 py-4 bg-emerald-50 text-emerald-600 rounded-3xl font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>সফলভাবে কার্টে যোগ করা হয়েছে!</span>
                      </div>
                      <button 
                        onClick={handleGoToPayment}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black flex items-center justify-center space-x-4 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] group"
                      >
                        <Clock className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-xl">পেমেন্ট করুন</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

