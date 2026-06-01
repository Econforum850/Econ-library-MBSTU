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

  // Trigger individual sticker printing (Optimized for label/sticker sizes)
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
            @page {
              size: 3in 2in; /* standard sticker label dimensions */
              margin: 2mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-card {
              border: 1.5px solid #000;
              padding: 10px;
              width: 260px;
              text-align: center;
              border-radius: 6px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 100%;
            }
            .title {
              font-size: 11px;
              font-weight: 800;
              margin-bottom: 2px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.2;
            }
            .author {
              font-size: 8px;
              color: #444;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 4px;
            }
            .qr-img {
              width: 70px;
              height: 70px;
              margin: 0 auto;
            }
            .book-id {
              font-size: 9px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 2px;
            }
            .meta {
              font-size: 8px;
              font-weight: 800;
              border: 1px solid #000;
              background: #f3f4f6 !important;
              color: #000 !important;
              padding: 1px 5px;
              border-radius: 3px;
              display: inline-block;
              margin-top: 2px;
              align-self: center;
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div>
              <div class="title">${book.title}</div>
              <div class="author">${book.author || 'লেখক অজানা'}</div>
            </div>
            <img class="qr-img" src="${qrUrl}" alt="QR Code" />
            <div>
              <div class="book-id">ID: <strong>${book.bookId}</strong></div>
              <div class="meta">শেলফ: ${book.shelfNo || 'উল্লেখ নেই'}</div>
            </div>
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

  // Trigger aggregate printing (Optimized for standard A4 sticker label sheets)
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
          <div>
            <div class="title">${book.title}</div>
            <div class="author">${book.author || 'লেখক অজানা'}</div>
          </div>
          <img class="qr-img" src="${qrUrl}" alt="QR" />
          <div>
            <div class="book-id">ID: <strong>${book.bookId}</strong></div>
            <div class="meta">শেলফ: ${book.shelfNo || 'উল্লেখ নেই'}</div>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>মোট স্টিকার শিট (${filteredBooks.length} টি)</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 0;
              margin: 0;
              background-color: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2 {
              font-size: 15px;
              font-weight: 900;
              text-align: center;
              margin: 0 0 15px 0;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .sticker-card {
              border: 1px dashed #000;
              padding: 10px;
              text-align: center;
              border-radius: 6px;
              background-color: #fff;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 180px;
              box-sizing: border-box;
            }
            .title {
              font-size: 11px;
              font-weight: 800;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.2;
              margin-bottom: 2px;
            }
            .author {
              font-size: 8px;
              color: #444;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 4px;
            }
            .qr-img {
              width: 70px;
              height: 70px;
              margin: 0 auto;
            }
            .book-id {
              font-size: 9px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 2px;
            }
            .meta {
              font-size: 8px;
              font-weight: 800;
              border: 1px solid #000;
              background: #f3f4f6 !important;
              color: #000 !important;
              padding: 1px 4px;
              border-radius: 3px;
              display: inline-block;
              margin-top: 2px;
              align-self: center;
            }
            @media print {
              .sticker-card {
                border: 1px solid #000 !important; /* solid lines for physical cutting on sheets */
              }
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
