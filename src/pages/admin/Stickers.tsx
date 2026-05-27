import { useState, useEffect } from 'react';
import { 
  QrCode, Printer, Search, RefreshCw, 
  Loader2, CheckCircle2, Download,
  LayoutGrid, List, FileDown, Eye
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseBook } from '@/src/lib/supabaseDatabase';

export default function AdminStickers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadBooks = async () => {
    try {
      setLoading(true);
      const fetched = await db.getBooks();
      // Physical books only need stickers
      setBooks(fetched.filter(b => !b.isEBook));
    } catch (err) {
      console.error('Stickers loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Trigger individual sticker printing
  const handlePrintSingle = (book: SupabaseBook) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(book.bookId)}`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ উইন্ডো ব্লক করা রয়েছে! ব্রাউজারের পপআপ চালু করুন।');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>প্রিন্ট স্টিকার - ${book.title}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #fff;
            }
            .sticker-card {
              border: 2px solid #000;
              padding: 20px;
              width: 250px;
              text-align: center;
              border-radius: 10px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .author {
              font-size: 12px;
              color: #555;
              margin-bottom: 12px;
            }
            .qr-img {
              width: 140px;
              height: 140px;
              margin: 0 auto 10px;
            }
            .meta {
              font-size: 11px;
              font-weight: bold;
              background: #000;
              color: #fff;
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="title">${book.title}</div>
            <div class="author">${book.author || 'লেখক অজানা'}</div>
            <img class="qr-img" src="${qrUrl}" alt="QR Code" />
            <div>ID: <strong style="font-family: monospace;">${book.bookId}</strong></div>
            <div class="meta">শেলফ: ${book.shelfNo || 'উল্লেখ নেই'}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Trigger aggregate printing
  const handlePrintAll = () => {
    if (filteredBooks.length === 0) {
      alert('প্রিন্ট করার মত কোনো বই পাওয়া যায়নি!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ উইন্ডো ব্লক করা রয়েছে! ব্রাউজারের পপআপ চালু করুন।');
      return;
    }

    let stickerItemsHtml = '';
    filteredBooks.forEach(book => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(book.bookId)}`;
      stickerItemsHtml += `
        <div class="sticker-card">
          <div class="title">${book.title}</div>
          <div class="author">${book.author || 'লেখক অজানা'}</div>
          <img class="qr-img" src="${qrUrl}" alt="QR" />
          <div>ID: <strong style="font-family: monospace;">${book.bookId}</strong></div>
          <div class="meta">শেলফ: ${book.shelfNo || 'উল্লেখ নেই'}</div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>মোট স্টিকার শিট (${filteredBooks.length} টি)</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 20px;
            }
            .sticker-card {
              border: 1px dashed #333;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .title {
              font-size: 13px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .author {
              font-size: 11px;
              color: #666;
              margin-bottom: 8px;
            }
            .qr-img {
              width: 100px;
              height: 100px;
              margin: 0 auto 5px;
            }
            .meta {
              font-size: 10px;
              background: #f0f0f0;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <h2>MBSTU অর্থনীতি বিভাগীয় লাইব্রেরি স্টিকার তালিকা (${filteredBooks.length} টি)</h2>
          <div class="grid-container">
            ${stickerItemsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">স্টিকার ও QR (Stickers)</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">বইয়ের ওপর আঠা দিয়ে লাগানোর জন্য অটোমেটিক বারকোড ও স্টিকার প্রিন্ট করুন</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handlePrintAll}
            className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white hover:bg-slate-900 rounded-[24px] font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 cursor-pointer text-sm"
          >
            <Printer className="w-5 h-5 flex-shrink-0" />
            <span>সব প্রিন্ট করুন (${filteredBooks.length})</span>
          </button>
          <button 
            onClick={loadBooks}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="বইয়ের শিরোনাম, লেখক বা শেলফ খুঁজুন..." 
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
          <div>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-bold">
                কোনো মেলানো বই পাওয়া যায়নি। ক্যাটালগ চেক করুন।
              </div>
            ) : (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              )}>
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all">
                    
                    {/* Live Decodable QR Image API */}
                    <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 relative p-3">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(book.bookId)}`}
                         alt={book.title}
                         className="w-full h-full object-contain"
                         referrerPolicy="no-referrer"
                       />
                    </div>

                    <h3 className="font-black text-slate-900 text-sm mb-1 line-clamp-1">{book.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 italic mb-2 line-clamp-1">{book.author || 'লেখক নির্দিষ্ট নেই'}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 bg-indigo-50 px-2.5 py-1 rounded-full">
                      ID: {book.bookId}
                    </p>
                    
                    <div className="flex w-full gap-2 mt-auto">
                        <button 
                          onClick={() => handlePrintSingle(book)}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>প্রিন্ট করুন</span>
                        </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
