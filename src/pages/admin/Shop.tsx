import { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Search, RefreshCw, 
  Loader2, CheckCircle2, Trash2, Edit2,
  ExternalLink, TrendingUp, DollarSign
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { fetchBooksFromSheet, SheetBook } from '@/src/lib/googleSheets';

export default function AdminShop() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<SheetBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_SHOP_URL || localStorage.getItem('sheet_shop');
      if (!sheetUrl) return;

      try {
        setLoading(true);
        const fetched = await fetchBooksFromSheet(sheetUrl);
        setBooks(fetched);
      } catch (err) {
        console.error('Shop fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">শপ বই ব্যবস্থাপনা</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {books.length} টি বই শপে ডিসপ্লে হচ্ছে</p>
            {books.length > 0 && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ শপ
              </span>
            )}
          </div>
        </div>
        <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>নতুন শপ আইটেম</span>
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="বইয়ের নাম খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">বই (Product)</th>
                <th className="px-8 py-5">ক্যাটাগরি</th>
                <th className="px-8 py-5">মূল্য (Price)</th>
                <th className="px-8 py-5">ষ্টক</th>
                <th className="px-8 py-5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      {book.cover && book.cover !== "" ? (
                        <img src={book.cover} className="w-12 h-16 object-cover rounded-xl shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900 line-clamp-1">{book.title}</p>
                        <p className="text-[10px] font-bold text-slate-400">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{book.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-emerald-600 font-black text-lg">{book.price}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", (book.stock || 0) > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="font-bold text-slate-600">{book.stock || 0} কপি</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-indigo-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-rose-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBooks.length === 0 && !loading && (
                  <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                          <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold">কোন বই পাওয়া যায়নি। সেটিংস থেকে গুগল শিট লিঙ্ক চেক করুন।</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>;
}
