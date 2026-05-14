import { useState, useEffect } from 'react';
import { 
  QrCode, Printer, Search, RefreshCw, 
  Loader2, CheckCircle2, Download,
  LayoutGrid, List
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { fetchBooksFromSheet, SheetBook } from '@/src/lib/googleSheets';

export default function AdminStickers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<SheetBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadBooks = async () => {
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || localStorage.getItem('sheet_inventory');
      if (!sheetUrl) return;

      try {
        setLoading(true);
        const fetched = await fetchBooksFromSheet(sheetUrl);
        setBooks(fetched);
      } catch (err) {
        console.error('Stickers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">স্টিকার ও QR কোড</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">বইয়ের জন্য অটোমেটিক বারকোড ও স্টিকার জেনারেট করুন</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Printer className="w-5 h-5" />
            <span>সব প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="বই খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all">
                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 relative overflow-hidden">
                   <QrCode className="w-24 h-24 text-slate-900" />
                   <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                </div>
                <h3 className="font-black text-slate-900 text-sm mb-1 line-clamp-1">{book.title}</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-4">{book.bookId}</p>
                <div className="flex w-full gap-2 mt-auto">
                    <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center space-x-2">
                        <Download className="w-3 h-3" />
                        <span>PNG</span>
                    </button>
                    <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100">
                        <Printer className="w-3 h-3" />
                        <span>প্রিন্ট</span>
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
