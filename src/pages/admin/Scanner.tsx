import { useState, useEffect, useRef } from 'react';
import { 
  Scan, BookOpen, AlertCircle, RefreshCw, 
  Loader2, CheckCircle2, User, HelpCircle, 
  ArrowRight, ShieldAlert, Library, BookOpenCheck, Bookmark, X,
  Plus, Minus
} from 'lucide-react';
import { db, SupabaseBook, SupabaseMember } from '@/src/lib/supabaseDatabase';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AdminScanner() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [matchedBook, setMatchedBook] = useState<SupabaseBook | null>(null);
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannedMessage, setScannedMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Issue quick formulation states
  const [showIssueQuickPanel, setShowIssueQuickPanel] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const allBooks = await db.getBooks();
      setBooks(allBooks);
      const allMembers = await db.getMembers();
      setMembers(allMembers.filter(m => m.status === 'accepted' || m.status === 'active'));
    } catch (err) {
      console.error('Loader scanner error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Start Live QR/Barcode Scanner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
      console.log(`Scan successful: ${decodedText}`, decodedResult);
      handleCodeReceived(decodedText);
      // Optional: Sound/Beep alert on success
    };

    const onScanFailure = (error: any) => {
      // Noise error logs are normal in camera setups, so skip them
    };

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Failed to clear scanner:', err));
      }
    };
  }, []);

  const handleCodeReceived = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();
    setScannedCode(cleanCode);
    setManualInput('');
    setScannedMessage(null);
    setShowIssueQuickPanel(false);

    // Search books in our database by bookId (or fallback standard id)
    const book = books.find(b => 
      b.bookId.toLowerCase() === cleanCode.toLowerCase() ||
      b.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (book) {
      setMatchedBook(book);
      setScannedMessage({ type: 'success', text: `সাফল্য! "${book.title}" বই আইডি মিল অমিল ক্যাটালগ খুঁজে পাওয়া গেছে।` });
    } else {
      setMatchedBook(null);
      setScannedMessage({ type: 'error', text: `দুঃখিত! "${cleanCode}" কোডটি মেম্বার বা লাইব্রেরি ক্যাটালগে নেই।` });
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleCodeReceived(manualInput);
  };

  const handleQuickIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedBook || !selectedMemberId) return;

    try {
      setIsSavingIssue(true);
      const targetMember = members.find(m => m.id === selectedMemberId);
      if (!targetMember) return;

      const issueDate = new Date().toLocaleDateString('bn-BD');
      const dynamicDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const dueDate = dynamicDue.toLocaleDateString('bn-BD');

      // 1. Save issue loan
      await db.saveIssue({
        bookTitle: matchedBook.title,
        memberName: targetMember.name,
        issueDate,
        dueDate,
        status: 'Active'
      });

      // 2. Decrement physical book stock
      if (matchedBook.stock > 0) {
        const updatedBook = {
          ...matchedBook,
          stock: matchedBook.stock - 1,
          status: (matchedBook.stock - 1 === 0) ? 'pre-order' as const : 'available' as const
        };
        await db.saveBook(updatedBook);
        setMatchedBook(updatedBook); // local representation edit
      }

      alert('বইটি সফলভাবে ইস্যু করা হয়েছে এবং স্টক আপডেট হয়েছে!');
      setShowIssueQuickPanel(false);
      setSelectedMemberId('');
      // Reload everything
      const updatedBooks = await db.getBooks();
      setBooks(updatedBooks);
    } catch (err) {
      console.error('Quick issue failed:', err);
      alert('সরাসরি বই লোন দিতে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleQuickReturn = async () => {
    if (!matchedBook) return;
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${matchedBook.title}" বইটি লাইব্রেরিতে ফেরত নিবেন?`)) {
      return;
    }

    try {
      setLoading(true);

      // Find an active issue loan for this book title
      const allIssues = await db.getIssues();
      const activeIssue = allIssues.find(i => 
        i.bookTitle.toLowerCase() === matchedBook.title.toLowerCase() && 
        i.status !== 'Returned'
      );

      if (activeIssue) {
        await db.saveIssue({
          ...activeIssue,
          status: 'Returned'
        });
      }

      // Update book stock
      const updatedBook = {
        ...matchedBook,
        stock: (matchedBook.stock || 0) + 1,
        status: 'available' as const
      };
      await db.saveBook(updatedBook);
      setMatchedBook(updatedBook);

      alert('বইটি সুন্দরভাবে ফেরত নেওয়া হয়েছে এবং ষ্টক +১ কপি বাড়ানো হয়েছে!');
      const updatedBooks = await db.getBooks();
      setBooks(updatedBooks);
    } catch (err) {
      console.error(err);
      alert('বই ফেরত সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (amount: number) => {
    if (!matchedBook) return;
    const newStock = Math.max(0, (matchedBook.stock || 0) + amount);
    try {
      const updatedBook = {
        ...matchedBook,
        stock: newStock,
        status: newStock === 0 ? 'pre-order' as const : 'available' as const
      };
      await db.saveBook(updatedBook);
      setMatchedBook(updatedBook);
      
      // Update books state so other actions recognize updated stock instantly
      setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    } catch (err) {
      console.error('Failed to adjust stock directly:', err);
      alert('সরাসরি স্টক আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বারকোড ও QR স্ক্যানার</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">ক্যামেরা অথবা গান স্ক্যানার ব্যবহার করে দ্রুত বইয়ের লোন বা ফেরত নিন</p>
        </div>
        <div className="flex gap-2">
          {books.length > 0 && (
            <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-black text-indigo-700">
              {books.length} টি বই স্ক্যান তালিকার অন্তর্ভুক্ত
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Live camera and lookups */}
        <div className="space-y-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1">
              <Scan className="w-5 h-5 text-indigo-600 animate-pulse" />
              লাইভ স্ক্যান (Live Scanning)
            </h3>
            <p className="text-xs text-slate-400 font-bold">বইয়ের ওপর থাকা বারকোড বা QR কোডটি ক্যামেরার সামনে ধরুন</p>
          </div>

          {/* HTML5 QR Reader Element */}
          <div className="rounded-[28px] overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 relative p-4">
             <div id="reader" className="w-full h-full text-slate-800 font-black no-border" />
          </div>

          <div className="relative flex items-center gap-4 py-2">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">অথবা গান স্ক্যানার বা আইডি দিয়ে খোজেন</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          {/* Key emulated manual input */}
          <form onSubmit={handleManualSearch} className="flex gap-4">
            <input 
              type="text" 
              placeholder="যেমন: R-101, b-1 বা অন্য যেকোনো আইডি লিখুন..."
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-100"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button 
              type="submit"
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all cursor-pointer"
            >
              খুঁজুন
            </button>
          </form>
        </div>

        {/* Right Column: Scan results and operations */}
        <div className="space-y-8">
          
          {/* Lookup status messages */}
          {scannedMessage && (
            <div className={cn(
              "p-6 rounded-[32px] border flex items-start gap-3 text-sm font-extrabold leading-relaxed",
              scannedMessage.type === 'success' 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-rose-50 border-rose-100 text-rose-800"
            )}>
              {scannedMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-black text-base">{scannedMessage.type === 'success' ? 'বই পাওয়া গেছে!' : 'বই মেলেনি!'}</p>
                <p className="text-xs font-bold mt-1 text-slate-500">{scannedMessage.text}</p>
              </div>
            </div>
          )}

          {/* Book found card with direct operations */}
          {matchedBook ? (
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
              <div className="flex gap-6 items-start pb-6 border-b border-slate-100">
                <div className="w-24 h-32 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-200 shadow-md flex items-center justify-center">
                  {matchedBook.cover ? (
                    <img src={matchedBook.cover} alt={matchedBook.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-lg tracking-wider mb-2 inline-block">
                    {matchedBook.category}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{matchedBook.title}</h3>
                  <p className="text-slate-400 font-bold text-sm italic">{matchedBook.author}</p>
                  
                  <div className="flex gap-4 mt-4 text-xs font-bold text-slate-500">
                    <p>লাইব্রেরি আইডি: <strong className="text-slate-800 font-mono">{matchedBook.bookId}</strong></p>
                    <p>শেলফ নম্বর: <strong className="text-indigo-600 font-mono">{matchedBook.shelfNo}</strong></p>
                  </div>
                </div>
              </div>

              {/* Real time Stock indicator & Quick Adjust Stock */}
              <div className="bg-slate-50 p-5 rounded-3xl space-y-3.5 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">বর্তমানে লাইব্রেরিতে আছে:</span>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black border uppercase shadow-sm font-sans",
                    matchedBook.stock > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                  )}>
                    {matchedBook.stock} কপি ষ্টকে আছে
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-sans">স্টক দ্রুত সমন্বয় (Quick Adjust):</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={matchedBook.stock <= 0}
                      onClick={() => handleAdjustStock(-1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 disabled:opacity-50 disabled:hover:text-slate-600 disabled:hover:border-slate-200 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-90 font-black cursor-pointer"
                      title="১ কপি কমান"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black px-2.5 py-1 bg-white border border-slate-200 rounded-lg min-w-[32px] text-center font-mono text-slate-700">
                      {matchedBook.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-90 font-black cursor-pointer"
                      title="১ কপি বাড়ান"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct borrow / return tools */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowIssueQuickPanel(true)}
                  disabled={matchedBook.stock <= 0}
                  className="py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all text-sm shadow-md shadow-indigo-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpenCheck className="w-5 h-5 flex-shrink-0" />
                  <span>লোন দিন / ইস্যু</span>
                </button>
                <button 
                  onClick={handleQuickReturn}
                  className="py-5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all text-sm shadow-md shadow-emerald-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5 flex-shrink-0" />
                  <span>ফেরত দিন (Return)</span>
                </button>
              </div>

              {/* Direct issuance form widget panel */}
              {showIssueQuickPanel && (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[30px] animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-800 text-sm">সরাসরি লোন কারি যাচাই করুন</h4>
                    <button onClick={() => setShowIssueQuickPanel(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleQuickIssue} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">সদস্য নির্বাচন করুন</label>
                      <select 
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                      >
                        <option value="">-- মেম্বার সিলেক্ট করুন --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => setShowIssueQuickPanel(false)} 
                        className="px-4 py-2 text-xs font-bold bg-white border rounded-lg text-slate-500"
                        disabled={isSavingIssue}
                      >
                        বাতিল
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 text-xs font-black bg-indigo-600 text-white rounded-lg shadow"
                        disabled={isSavingIssue}
                      >
                        {isSavingIssue ? 'ইস্যু করা হচ্ছে...' : 'ইস্যু কনফার্ম'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center text-slate-300">
              <Library className="w-16 h-16 mb-4 text-slate-200" />
              <p className="font-extrabold text-slate-400">কোনো বই এখনো লোড করা হয়নি</p>
              <p className="text-xs font-bold text-slate-300 mt-2">বারকোড স্ক্যান করুন অথবা উপরে ম্যানুয়ালি কোড লিখে খুঁজুন</p>
            </div>
          )}

          {/* Quick FAQ info panel */}
          <div className="bg-indigo-50/30 p-6 rounded-[35px] border border-indigo-100/50 text-left space-y-2">
            <h4 className="text-indigo-900 font-black text-xs flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500" /> কিভাবে কাজ করে?
            </h4>
            <div className="text-[10px] font-bold text-indigo-700/80 leading-relaxed space-y-1">
              <p>১. জেনারেটকৃত যেকোনো বুক কভার স্কয়ার বারকোড স্টিকার জুম করে স্ক্যান করুন।</p>
              <p>২. ক্যাটালগ খুঁজে পেলে বইয়ের বর্তমান কপি সংখ্যা সরাসরি এবং রিয়্যাল টাইমে ট্র্যাক হবে।</p>
              <p>৩. ওয়ান-ক্লিক ট্রোজান অ্যাকশন ব্যবহার করে স্টুডেন্টদের লোন বরাদ্দ বা রিলিজ করুন।</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
