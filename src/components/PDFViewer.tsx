import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight, 
  Highlighter, Plus, AlertCircle, Bookmark, Check, Trash2, 
  BookOpen, Edit, Loader2, Pin, Info, FileText, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, EbookHighlight, EbookNote, EbookBookmark } from '@/src/lib/supabaseDatabase';
import { cn } from '@/src/lib/utils';

interface PDFViewerProps {
  book: {
    id: string;
    title: string;
    author: string;
    category: string;
    cover: string;
    isEBook?: boolean;
    ebookUrl?: string;
  };
  loggedInUser: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  onClose: () => void;
  lang: 'BN' | 'EN';
}

export default function PDFViewer({ book, loggedInUser, onClose, lang }: PDFViewerProps) {
  // Navigation & Viewer states
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'slate'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'highlights' | 'notes' | 'bookmarks'>('highlights');

  // Success message toaster state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Database Assets states
  const [highlights, setHighlights] = useState<EbookHighlight[]>([]);
  const [notes, setNotes] = useState<EbookNote[]>([]);
  const [bookmarks, setBookmarks] = useState<EbookBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Forms state
  // 1. Highlight form
  const [hlText, setHlText] = useState('');
  const [hlColor, setHlColor] = useState<'yellow' | 'blue' | 'green' | 'red'>('yellow');
  const [hlPage, setHlPage] = useState(1);
  const [hlIsSaving, setHlIsSaving] = useState(false);

  // 2. Note form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'sticky' | 'quick' | 'private'>('sticky');
  const [notePage, setNotePage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteIsSaving, setNoteIsSaving] = useState(false);

  // List filters
  const [filterMode, setFilterMode] = useState<'all' | 'current'>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Format and clean iframe URL for robust Google Drive embed rendering
  const getEmbedUrl = (url?: string) => {
    if (!url) return "";
    try {
      if (url.includes('drive.google.com')) {
        let cleanUrl = url;
        if (cleanUrl.includes('/view')) {
          cleanUrl = cleanUrl.replace('/view', '/preview');
        } else if (!cleanUrl.includes('/preview') && cleanUrl.includes('/d/')) {
          const parts = cleanUrl.split('/d/');
          if (parts[1]) {
            const idPart = parts[1].split('/')[0];
            cleanUrl = `https://drive.google.com/file/d/${idPart}/preview`;
          }
        }
        return cleanUrl;
      }
    } catch (e) {
      console.warn("Error cleaning embed URL:", e);
    }
    return url;
  };

  // Helper to show temporary feedback message in the sidebar
  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Load digital reading assets when viewer mounts
  useEffect(() => {
    let active = true;
    const loadAssets = async () => {
      if (!book || !loggedInUser) return;
      setIsLoading(true);
      try {
        const [hls, nts, bms] = await Promise.all([
          db.getEbookHighlights(book.id, loggedInUser.id).catch(() => []),
          db.getEbookNotes(book.id, loggedInUser.id).catch(() => []),
          db.getEbookBookmarks(book.id, loggedInUser.id).catch(() => [])
        ]);
        if (active) {
          setHighlights(hls);
          setNotes(nts);
          setBookmarks(bms);
          
          // Optionally restore last read page from progress
          const prog = await db.getEbookProgress(book.id, loggedInUser.id).catch(() => null);
          if (active && prog && prog.lastPage) {
            setCurrentPage(prog.lastPage);
            setHlPage(prog.lastPage);
            setNotePage(prog.lastPage);
          }
        }
      } catch (err) {
        console.error("Error loading reader assets:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadAssets();
    return () => { active = false; };
  }, [book, loggedInUser]);

  // Handle active study page selection
  const handlePageSelectChange = (val: number) => {
    const pageNum = Math.max(1, isNaN(val) ? 1 : val);
    setCurrentPage(pageNum);
    setHlPage(pageNum);
    setNotePage(pageNum);
    saveProgress(pageNum);
  };

  // Update study progress log in Firestore
  const saveProgress = async (pageNum: number) => {
    if (!book || !loggedInUser) return;
    try {
      const estimatedTotalPages = 150; // default estimated size
      const percentage = Math.min(100, Math.round((pageNum / estimatedTotalPages) * 100));
      await db.saveEbookProgress({
        bookId: book.id,
        bookTitle: book.title,
        memberId: loggedInUser.id,
        progress: percentage,
        lastPage: pageNum,
        updatedAt: new Date().toLocaleDateString('bn-BD')
      });
    } catch (err) {
      console.warn("Unable to store reading statistics:", err);
    }
  };

  // Hardened toggle bookmark for the current study page
  const handleToggleBookmark = async () => {
    if (!book || !loggedInUser) return;
    try {
      const match = bookmarks.find(bm => bm.pageNumber === currentPage);
      if (match) {
        await db.deleteEbookBookmark(match.id);
        setBookmarks(prev => prev.filter(bm => bm.id !== match.id));
        showFeedback(lang === 'BN' ? 'বুকমার্ক সরানো হয়েছে।' : 'Bookmark removed.');
      } else {
        const result = await db.saveEbookBookmark({
          bookId: book.id,
          memberId: loggedInUser.id,
          pageNumber: currentPage
        });
        setBookmarks(prev => [...prev, result]);
        showFeedback(lang === 'BN' ? 'পৃষ্ঠাটি বুকমার্ক করা হয়েছে!' : 'Page bookmarked successfully!');
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  const isBookmarked = useMemo(() => {
    return bookmarks.some(bm => bm.pageNumber === currentPage);
  }, [bookmarks, currentPage]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Save new Highlight/Clipping quote to Firestore
  const handleSaveHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !loggedInUser || !hlText.trim()) return;
    setHlIsSaving(true);
    try {
      const res = await db.saveEbookHighlight({
        bookId: book.id,
        memberId: loggedInUser.id,
        pageNumber: hlPage,
        color: hlColor,
        text: hlText.trim()
      });
      setHighlights(prev => {
        const idx = prev.findIndex(h => h.id === res.id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = res;
          return updated;
        }
        return [...prev, res];
      });
      setHlText('');
      showFeedback(lang === 'BN' ? 'হাইলাইট সফলভাবে যুক্ত হয়েছে!' : 'Highlight quote added successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setHlIsSaving(false);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    try {
      await db.deleteEbookHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
      showFeedback(lang === 'BN' ? 'হাইলাইটটি মুছে ফেলা হয়েছে।' : 'Highlight removed.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save or Update Study Note to Firestore
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !loggedInUser || !noteText.trim()) return;
    setNoteIsSaving(true);
    try {
      const res = await db.saveEbookNote({
        id: editingNoteId || undefined,
        bookId: book.id,
        memberId: loggedInUser.id,
        pageNumber: notePage,
        text: noteText.trim(),
        title: noteTitle.trim() || (lang === 'BN' ? `নোট - পৃষ্ঠা ${notePage}` : `Page ${notePage} Note`),
        type: noteType
      });
      setNotes(prev => {
        const idx = prev.findIndex(n => n.id === res.id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = res;
          return updated;
        }
        return [...prev, res];
      });
      setNoteText('');
      setNoteTitle('');
      setEditingNoteId(null);
      showFeedback(lang === 'BN' ? 'নোটটি সফলভাবে সংরক্ষিত হয়েছে!' : 'Study note saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setNoteIsSaving(false);
    }
  };

  const handleStartEditNote = (note: EbookNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteText(note.text);
    setNotePage(note.pageNumber);
    setNoteType(note.type);
    setActiveTab('notes');
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await db.deleteEbookNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setNoteText('');
        setNoteTitle('');
      }
      showFeedback(lang === 'BN' ? 'নোটটি মুছে ফেলা হয়েছে।' : 'Note removed successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered highlights and notes list
  const filteredHighlights = useMemo(() => {
    let list = [...highlights];
    if (filterMode === 'current') {
      list = list.filter(h => h.pageNumber === currentPage);
    }
    return list.sort((a, b) => a.pageNumber - b.pageNumber);
  }, [highlights, currentPage, filterMode]);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (filterMode === 'current') {
      list = list.filter(n => n.pageNumber === currentPage);
    }
    return list.sort((a, b) => a.pageNumber - b.pageNumber);
  }, [notes, currentPage, filterMode]);

  return (
    <div 
      id="pdf-immersive-reader"
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[140] w-full h-full flex flex-col font-sans transition-all duration-300",
        themeMode === 'light' && "bg-slate-100 text-slate-800",
        themeMode === 'slate' && "bg-[#eceef2] text-slate-900",
        themeMode === 'dark' && "bg-slate-950 text-slate-100"
      )}
    >
      {/* Immersive Reader Toolbar Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4.5 border-b border-slate-200/50 shadow-xs bg-white/95 text-slate-900 z-10 select-none">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-full transition-colors font-bold flex items-center justify-center cursor-pointer"
            title={lang === 'BN' ? 'পড়া বন্ধ করুন' : 'Exit Reader'}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest leading-none mb-1">
              {lang === 'BN' ? 'পিডিএফ রিডার ও নোটস সহায়ক' : 'PDF READER & NOTES COMPANION'}
            </span>
            <h1 className="text-sm font-black text-slate-900 leading-none truncate max-w-[280px] md:max-w-[450px]">
              {book.title}
            </h1>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 border border-slate-200/65 rounded-full p-0.5 text-[9px] font-black uppercase tracking-wider">
            <button 
              type="button"
              onClick={() => setThemeMode('light')}
              className={cn("px-2.5 py-1.5 rounded-full transition", themeMode === 'light' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800')}
            >
              {lang === 'BN' ? 'আলো' : 'Light'}
            </button>
            <button 
              type="button"
              onClick={() => setThemeMode('slate')}
              className={cn("px-2.5 py-1.5 rounded-full transition", themeMode === 'slate' ? 'bg-indigo-50 text-indigo-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800')}
            >
              {lang === 'BN' ? 'গ্রে' : 'Slate'}
            </button>
            <button 
              type="button"
              onClick={() => setThemeMode('dark')}
              className={cn("px-2.5 py-1.5 rounded-full transition", themeMode === 'dark' ? 'bg-slate-900 text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-800')}
            >
              {lang === 'BN' ? 'ডার্ক' : 'Dark'}
            </button>
          </div>

          {/* Fullscreen Mode */}
          <button 
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 hover:bg-slate-50 rounded-full transition text-slate-600 cursor-pointer"
            title={isFullscreen ? (lang === 'BN' ? 'ফুল স্ক্রিন বন্ধ' : 'Exit Fullscreen') : (lang === 'BN' ? 'ফুল স্ক্রিন' : 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5 text-rose-500" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>

          {/* Sidebar Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs select-none cursor-pointer transition flex items-center gap-2 border",
              isSidebarOpen 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'BN' ? 'পড়া ও নোট' : 'Notes Sidebar'}</span>
          </button>
        </div>
      </header>

      {/* Main Row layout for viewer content */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* LEFT COMPONENT: The main standard PDF Iframe Viewer */}
        <main className="flex-1 h-full p-2 md:p-3 bg-slate-900 relative flex flex-col justify-between">
          {book.ebookUrl ? (
            <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden shadow-xl relative border border-white/5 flex flex-col">
              <iframe
                id="pdf-iframe-viewer"
                src={getEmbedUrl(book.ebookUrl)}
                className="w-full h-full border-none rounded-2xl"
                title={book.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer"
              ></iframe>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-950 rounded-2xl">
              <AlertCircle className="w-12 h-12 text-slate-500 mb-3 animate-bounce" />
              <p className="text-sm font-bold">
                {lang === 'BN' ? 'এই বইটির পিডিএফ ফাইল লিংক পাওয়া যায়নি।' : 'No PDF document url provided for this book.'}
              </p>
            </div>
          )}
        </main>

        {/* RIGHT COMPONENT: Interactive Page Notes & Highlight Companion Panel */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-none h-full bg-white border-l border-slate-200 shadow-lg flex flex-col z-20 overflow-hidden text-slate-800"
            >
              {/* Top: Active Study Page & Bookmark Control bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 select-none">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                      {lang === 'BN' ? 'অধ্যয়ন পৃষ্ঠা নির্দেশক' : 'ACTIVE STUDY PAGE'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {lang === 'BN' ? 'পিডিএফ মিলিয়ে পেইজ সিলেক্ট করুন' : 'Align tabs with your PDF page'}
                    </span>
                  </div>

                  {/* Page and Bookmarks controllers */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-white border border-slate-250 rounded-lg p-1 shadow-2xs">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageSelectChange(currentPage - 1)}
                        className="p-1 disabled:opacity-35 hover:bg-slate-100 transition rounded text-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <input 
                        type="number"
                        min="1"
                        value={currentPage}
                        onChange={(e) => handlePageSelectChange(parseInt(e.target.value))}
                        className="w-10 text-center font-bold font-mono text-slate-800 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handlePageSelectChange(currentPage + 1)}
                        className="p-1 hover:bg-slate-100 transition rounded text-slate-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bookmark Trigger */}
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      className={cn(
                        "p-2.5 rounded-lg transition border cursor-pointer",
                        isBookmarked 
                          ? "bg-amber-100 border-amber-200 text-amber-700" 
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                      title={lang === 'BN' ? 'বুকমার্ক করুন' : 'Bookmark this page'}
                    >
                      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                  </div>
                </div>

                {/* Sub-toaster overlay */}
                <AnimatePresence>
                  {successMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 p-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-100 rounded-lg flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="flex-1">{successMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar Tab switches */}
              <div className="flex border-b border-slate-200 p-2 gap-1 bg-slate-50 md:p-3">
                <button
                  type="button"
                  onClick={() => { setActiveTab('highlights'); setHlPage(currentPage); }}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer text-center",
                    activeTab === 'highlights' 
                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" 
                      : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {lang === 'BN' ? 'হাইলাইটস' : 'Highlights'}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('notes'); setNotePage(currentPage); }}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer text-center",
                    activeTab === 'notes' 
                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" 
                      : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {lang === 'BN' ? 'বিশেষ নোট' : 'Page Notes'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookmarks')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer text-center",
                    activeTab === 'bookmarks' 
                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" 
                      : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {lang === 'BN' ? 'বুকমার্ক' : 'Bookmarks'}
                </button>
              </div>

              {/* Interactive workspace forms/lists */}
              <div className="flex-1 overflow-y-auto p-4.5 space-y-5">
                
                {/* TAB 1: HIGHLIGHTS/CLIPPED CONTENT */}
                {activeTab === 'highlights' && (
                  <div className="space-y-4">
                    {/* Add Highlight Form */}
                    <form onSubmit={handleSaveHighlight} className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl text-left space-y-3.5">
                      <span className="font-black text-[10px] uppercase text-[#78350f] tracking-wider block">
                        🖍️ {lang === 'BN' ? 'পিডিএফ হাইলাইট কপি-পেস্ট করুন' : 'ADD NEW PDF HIGHLIGHT'}
                      </span>
                      
                      <div>
                        <textarea
                          required
                          value={hlText}
                          onChange={(e) => setHlText(e.target.value)}
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-3 focus:ring-indigo-100 placeholder-slate-400 resize-none"
                          placeholder={lang === 'BN' ? 'পিডিএফ পেজে গুরুত্ববহ অংশটি এখানে পেস্ট করুন...' : 'Paste here words, equations or key lines you want to save...'}
                        ></textarea>
                      </div>

                      <div className="flex items-center justify-between gap-1 select-none">
                        {/* Selector Color */}
                        <div className="flex items-center gap-1.5">
                          {(['yellow', 'green', 'blue', 'red'] as const).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setHlColor(c)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition transform hover:scale-110",
                                c === 'yellow' && "bg-yellow-100 border-yellow-400",
                                c === 'green' && "bg-emerald-100 border-emerald-400",
                                c === 'blue' && "bg-sky-100 border-sky-400",
                                c === 'red' && "bg-rose-100 border-rose-400",
                                hlColor === c ? "scale-110 shadow-sm border-indigo-600" : "border-white"
                              )}
                            />
                          ))}
                        </div>

                        {/* Page Number specification */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <label className="font-extrabold text-slate-400 font-mono">Page:</label>
                          <input 
                            type="number"
                            min="1"
                            value={hlPage}
                            onChange={(e) => setHlPage(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-11 px-1 py-1 font-bold font-mono text-center border border-slate-200 rounded"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={hlIsSaving || !hlText.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        {hlIsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>{lang === 'BN' ? 'হাইলাইট সংরক্ষণ করুন' : 'Save PDF Highlight'}</span>
                      </button>
                    </form>

                    {/* Filter Mode */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 select-none text-xs">
                      <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                        {lang === 'BN' ? 'সংরক্ষিত হাইলাইটস তালিকা' : 'MY PDF HIGHLIGHTS'}
                      </span>
                      
                      <div className="flex bg-slate-100 p-0.5 rounded-lg font-bold text-[10px] text-slate-500">
                        <button
                          type="button"
                          onClick={() => setFilterMode('all')}
                          className={cn("px-2.5 py-1 rounded-md transition", filterMode === 'all' ? "bg-white text-slate-800 font-bold" : "hover:text-slate-800")}
                        >
                          {lang === 'BN' ? 'সব পৃষ্ঠা' : 'All pages'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterMode('current')}
                          className={cn("px-2.5 py-1 rounded-md transition", filterMode === 'current' ? "bg-white text-slate-800 font-bold" : "hover:text-slate-800")}
                        >
                          {lang === 'BN' ? `পৃষ্ঠা ${currentPage}` : `Page ${currentPage}`}
                        </button>
                      </div>
                    </div>

                    {/* Highlights List */}
                    {filteredHighlights.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold leading-normal border-2 border-dashed border-slate-100 rounded-2xl select-none">
                        {lang === 'BN' 
                          ? 'কোনো হাইলাইট যুক্ত করা হয়নি।' 
                          : 'No highlights saved. Clip lines and enter page numbers above to archive them.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHighlights.map((hl) => (
                          <div 
                            key={hl.id}
                            onClick={() => handlePageSelectChange(hl.pageNumber)}
                            className={cn(
                              "relative p-4 rounded-xl border text-xs text-left group transition duration-150 cursor-pointer hover:shadow-xs",
                              hl.color === 'green' ? "bg-emerald-50/40 border-emerald-100" :
                              hl.color === 'blue' ? "bg-sky-50/40 border-sky-100" :
                              hl.color === 'red' ? "bg-rose-50/40 border-rose-100" :
                              "bg-yellow-50/40 border-yellow-105"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl",
                              hl.color === 'green' ? "bg-emerald-400" :
                              hl.color === 'blue' ? "bg-sky-400" :
                              hl.color === 'red' ? "bg-rose-400" :
                              "bg-yellow-400"
                            )} />

                            <div className="flex items-center justify-between gap-1 mb-1 bg-white/40 px-1 py-0.5 rounded">
                              <span className="font-extrabold font-mono text-[9px] text-[#78350f] uppercase">
                                {lang === 'BN' ? `পৃষ্ঠা ${hl.pageNumber}` : `Page ${hl.pageNumber}`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(hl.id); }}
                                className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Remove highlight"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="font-semibold text-slate-700 italic pr-2 pl-1 break-word">
                              "{hl.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SPECIAL LESSON NOTES */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {/* Add/Edit Note Form */}
                    <form onSubmit={handleSaveNote} className="p-4 bg-[#f8fafc] border border-slate-205 rounded-2xl text-left space-y-3">
                      <span className="font-black text-[10px] uppercase text-indigo-700 tracking-wider block">
                        📝 {editingNoteId ? (lang === 'BN' ? 'নোট সংশোধন করুন' : 'EDIT E-NOTE') : (lang === 'BN' ? 'নতুন নোট বা চিরকুট যোগ করুন' : 'ADD SPECIAL LESSON NOTE')}
                      </span>

                      <div>
                        <input
                          type="text"
                          required
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-3 focus:ring-indigo-100 placeholder-slate-400"
                          placeholder={lang === 'BN' ? 'নোটের সংক্ষিপ্ত শিরোনাম (যেমন: প্রধান সমীকরণ)' : 'Note Title (e.g., Solow-Swan Growth Equation)'}
                        />
                      </div>

                      <div>
                        <textarea
                          required
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={4}
                          className="w-full px-3.5 py-2 px bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-3 focus:ring-indigo-100 placeholder-slate-400 resize-none leading-relaxed"
                          placeholder={lang === 'BN' ? 'এখানে আপনার বিশদ পড়াশোনার সূত্র বা টীকাটি লিখুন...' : 'Write down your detailed study comments, calculations or reference bookmarks...'}
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Note difficulty or security type */}
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Type:</label>
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-bold text-slate-700 text-xs focus:outline-none"
                          >
                            <option value="sticky">{lang === 'BN' ? 'স্টিকি' : 'Sticky Pin'}</option>
                            <option value="quick">{lang === 'BN' ? 'কুইক রিভিশন' : 'Quick Revision'}</option>
                            <option value="private">{lang === 'BN' ? 'ব্যক্তিগত' : 'Private Note'}</option>
                          </select>
                        </div>

                        {/* Page number */}
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Page Num:</label>
                          <input 
                            type="number"
                            min="1"
                            value={notePage}
                            onChange={(e) => setNotePage(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-2 py-1.5 font-bold font-mono border border-slate-200 rounded text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-1.5 select-none">
                        {editingNoteId && (
                          <button
                            type="button"
                            onClick={() => { setEditingNoteId(null); setNoteText(''); setNoteTitle(''); }}
                            className="flex-1 py-2 bg-slate-200 hover:bg-slate-250 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            {lang === 'BN' ? 'বাতিল' : 'Cancel'}
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={noteIsSaving || !noteText.trim()}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {noteIsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{editingNoteId ? (lang === 'BN' ? 'হালনাগাদ' : 'Update Note') : (lang === 'BN' ? 'যুক্ত করুন' : 'Save Note')}</span>
                        </button>
                      </div>
                    </form>

                    {/* Filter Mode */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 select-none text-xs">
                      <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                        {lang === 'BN' ? 'সংরক্ষিত লেসন নোটস' : 'MY LESSON NOTES'}
                      </span>
                      
                      <div className="flex bg-slate-100 p-0.5 rounded-lg font-bold text-[10px] text-slate-500">
                        <button
                          type="button"
                          onClick={() => setFilterMode('all')}
                          className={cn("px-2.5 py-1 rounded-md transition", filterMode === 'all' ? "bg-white text-slate-800 font-bold" : "hover:text-slate-800")}
                        >
                          {lang === 'BN' ? 'সব পৃষ্ঠা' : 'All pages'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterMode('current')}
                          className={cn("px-2.5 py-1 rounded-md transition", filterMode === 'current' ? "bg-white text-slate-800 font-bold" : "hover:text-slate-800")}
                        >
                          {lang === 'BN' ? `পৃষ্ঠা ${currentPage}` : `Page ${currentPage}`}
                        </button>
                      </div>
                    </div>

                    {/* Notes List */}
                    {filteredNotes.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold leading-normal border-2 border-dashed border-slate-100 rounded-2xl select-none">
                        {lang === 'BN' 
                          ? 'কোনো নোট খুঁজে পাওয়া যায়নি।' 
                          : 'No study notes recorded. Use the inputs above to save formulas and exam cues.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredNotes.map((n) => (
                          <div 
                            key={n.id}
                            onClick={() => handlePageSelectChange(n.pageNumber)}
                            className="p-4.5 bg-amber-50/25 border border-amber-200/50 rounded-xl relative text-left group hover:bg-amber-50/40 hover:shadow-xs transition duration-150 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1.5 bg-white/40 px-1 py-0.5 rounded">
                              <span className="px-2 py-0.5 bg-amber-100 text-[#78350f] font-mono font-black text-[8px] uppercase rounded">
                                {lang === 'BN' ? `পৃষ্ঠা ${n.pageNumber}` : `Page ${n.pageNumber}`}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleStartEditNote(n); }}
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded transition cursor-pointer"
                                  title="Edit note"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                                  className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-extrabold text-[#78350f] text-xs mb-1">
                              {n.title}
                            </h4>
                            <p className="text-slate-600 text-xs leading-relaxed font-semibold break-words whitespace-pre-wrap">
                              {n.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: BOOKMARKS */}
                {activeTab === 'bookmarks' && (
                  <div className="space-y-4">
                    <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest block text-left">
                      🔖 {lang === 'BN' ? 'বুকমার্ক করা পৃষ্ঠাসমূহ' : 'BOOKMARKED PAGES'}
                    </span>

                    {bookmarks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold leading-normal border-2 border-dashed border-slate-100 rounded-2xl select-none">
                        {lang === 'BN' 
                          ? 'কোনো পৃষ্ঠা বুকমার্ক করা নেই। বুকমার্ক করতে ওপরের বুকমার্ক বাটনে ট্যাপ করুন।' 
                          : 'No bookmarks set. Navigate to any page and click the bookmark ribbon icon above.'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        {bookmarks.map((bm) => (
                          <div 
                            key={bm.id}
                            onClick={() => handlePageSelectChange(bm.pageNumber)}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-3xs cursor-pointer hover:border-slate-400 text-xs transition font-black text-slate-800"
                          >
                            <span className="flex items-center gap-1">
                              <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current" />
                              <span>{lang === 'BN' ? `পৃষ্ঠা ${bm.pageNumber}` : `Page ${bm.pageNumber}`}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePageSelectChange(bm.pageNumber); handleToggleBookmark(); }}
                              className="p-1 text-slate-350 hover:text-rose-500 rounded transition shrink-0 cursor-pointer"
                              title="Delete bookmark"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
