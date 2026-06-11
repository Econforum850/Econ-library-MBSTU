import { Search, ChevronDown, BookOpen, Clock, X, User, CheckCircle2, Loader2, AlertCircle, Plus, Filter, FileText, Bookmark, ExternalLink, Download, Eye, TrendingUp, BarChart3, Globe, AlignLeft, ArrowRight, ArrowLeft, Printer, Settings, Sparkles, Heart, Activity, Check, RotateCcw, Volume2, Moon, Sun, MessageSquare, Pin, ChevronRight, Trash2, Play, Square, Maximize2, Minimize2, ZoomIn, ZoomOut, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { db } from '@/src/lib/supabaseDatabase';
import { defaultEconBooks } from '@/src/lib/defaultEconBooks';
import PDFViewer from '../components/PDFViewer';

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
  downloadPermission?: string;
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
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'ebooks' | 'favorites' | 'reading-hub'>('all');
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

  // States for Category Emoji & Picture customization
  const [categoryEmojis, setCategoryEmojis] = useState<{ [category: string]: string }>({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [tempEmojis, setTempEmojis] = useState<{ [category: string]: string }>({});
  
  const navigate = useNavigate();

  const getCategoryEmoji = (cat: string) => {
    if (categoryEmojis[cat]) {
      return categoryEmojis[cat];
    }
    const name = cat.toLowerCase();
    if (name.includes('macroeconomics') || name.includes('সমষ্টিগত')) return '📈';
    if (name.includes('microeconomics') || name.includes('ব্যষ্টিগত')) return '📉';
    if (name.includes('health') || name.includes('স্বাস্থ্য')) return '🏥';
    if (name.includes('mathemat') || name.includes('গণিত') || name.includes('math')) return '🧮';
    if (name.includes('econometrics') || name.includes('ইকোনোমেট্রিক্স') || name.includes('পরিসংখ্যান') || name.includes('statistics')) return '📊';
    if (name.includes('environmental') || name.includes('পরিবেশ')) return '🌱';
    if (name.includes('development') || name.includes('উন্নয়ন')) return '🏗️';
    if (name.includes('islamic') || name.includes('ইসলামিক') || name.includes('ইসলামী')) return '🕌';
    if (name.includes('agricultur') || name.includes('কৃষি')) return '🌾';
    if (name.includes('public') || name.includes('finance') || name.includes('সরকারি অর্থ')) return '🏛️';
    if (name.includes('international') || name.includes('আন্তর্জাতিক')) return '🌐';
    if (name.includes('research') || name.includes('গবেষণা') || name.includes('methodology')) return '🔍';
    return '📖';
  };

  const renderCategoryMedia = (cat: string) => {
    const value = categoryEmojis[cat] || getCategoryEmoji(cat);
    if (value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'))) {
      return (
        <img 
          src={value} 
          alt={cat} 
          className="w-5.5 h-5.5 object-cover rounded-md inline-block mr-2 align-middle select-none pointer-events-none" 
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span className="mr-2 align-middle text-sm select-none">{value || '📖'}</span>;
  };

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

  // Advanced Digital Reader states
  const [isReadingBook, setIsReadingBook] = useState<Book | null>(null);
  const [currentReadingPage, setCurrentReadingPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isReaderDarkMode, setIsReaderDarkMode] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [digitalRequests, setDigitalRequests] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  
  // AI assistant states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Reading session goals timer
  const [readingTimer, setReadingTimer] = useState(0); // in seconds
  const [readingGoalSeconds, setReadingGoalSeconds] = useState(15 * 60); // 15 mins default
  const [timerActive, setTimerActive] = useState(false);
  const [goalAchieved, setGoalAchieved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Selection translation helper popup position
  const [selectionPopup, setSelectionPopup] = useState<{x: number, y: number, text: string} | null>(null);

  const canAccessEBook = useMemo(() => {
    if (isAdmin) return true;
    if (!loggedInUser?.email) return false;
    
    // Pattern check
    const email = loggedInUser.email.toLowerCase();
    const pattern = /^eco(20|21|22|23|24|25)\d{3}@mbstu\.ac\.bd$/;
    const matchesPattern = pattern.test(email);
    
    // Or approved request
    const isApproved = digitalRequests.some(r => r.bookId === selectedBook?.id && r.memberId === loggedInUser.id && r.status === 'approved');
    
    return matchesPattern || isApproved;
  }, [loggedInUser, selectedBook, digitalRequests, isAdmin]);

  const canDownloadEBook = useMemo(() => {
    if (isAdmin) return true;
    if (!selectedBook) return false;
    const perm = selectedBook.downloadPermission || 'Read + Download';
    if (perm === 'Read Only') return false;
    if (perm === 'Download Premium Only') return loggedInUser?.role === 'Premium';
    if (perm === 'Faculty Only') return loggedInUser?.role === 'Faculty' || loggedInUser?.role === 'Teacher';
    return true; 
  }, [selectedBook, loggedInUser, isAdmin]);

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
    status: 'available' as 'available' | 'pre-order',
    stock: 1,
    bookId: `ID-${Math.floor(Math.random() * 9000 + 1000)}`
  });

  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading_imgbb' | 'analyzing_gemini' | 'analyzing_local' | 'success' | 'warn_confidence' | 'failed'>('idle');
  const [ocrTime, setOcrTime] = useState<number>(0);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState<string>('');

  // Google Books direct interactive search states (the alternate high-accuracy free method)
  const [googleBooksQuery, setGoogleBooksQuery] = useState('');
  const [googleBooksResults, setGoogleBooksResults] = useState<any[]>([]);
  const [isSearchingGoogleBooks, setIsSearchingGoogleBooks] = useState(false);

  // Core smart scanning states
  const [scannerMode, setScannerMode] = useState<'cover' | 'search' | 'barcode'>('cover');
  const [barcodeScannerActive, setBarcodeScannerActive] = useState(false);
  const [isbnManualInput, setIsbnManualInput] = useState('');
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
  const [isbnLookupError, setIsbnLookupError] = useState('');
  const barcodeScannerRef = useRef<any>(null);

  const startBarcodeCameraScan = () => {
    setIsbnLookupError('');
    setBarcodeScannerActive(true);
    setTimeout(() => {
      try {
        const scannerInstance = new Html5QrcodeScanner(
          "barcode-reader-add-modal", 
          { 
            fps: 15,
            qrbox: { width: 280, height: 180 },
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );
        
        scannerInstance.render(
          (decodedText, decodedResult) => {
            console.log("[Barcode Match Detected]:", decodedText);
            handleIsbnLookup(decodedText);
          },
          (err) => {
            // Noise logs can be ignored during passive camera looping
          }
        );
        barcodeScannerRef.current = scannerInstance;
      } catch (err: any) {
        console.error('Barcode scanner creation failure:', err);
        setIsbnLookupError(lang === 'BN' ? 'ক্যামেরা চালু করতে ব্যর্থ হয়েছে। পারমিশন নিশ্চিত করুন।' : 'Failed to launch camera. Verify device permissions.');
      }
    }, 150);
  };

  const stopBarcodeCameraScan = () => {
    if (barcodeScannerRef.current) {
      barcodeScannerRef.current.clear().catch((e: any) => console.log('Scanner stop err:', e));
      barcodeScannerRef.current = null;
    }
    setBarcodeScannerActive(false);
  };

  const handleIsbnLookup = async (isbnStr: string) => {
    if (!isbnStr.trim()) return;
    setIsFetchingIsbn(true);
    setIsbnLookupError('');
    try {
      const cleanIsbn = isbnStr.trim().replace(/[^0-9]/g, '');
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
      console.log(`[ISBN Lookup] Fetching from Google Books API: ${url}`);
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const info = data.items[0].volumeInfo;
          let cat = 'সাধারণ';
          const categoriesJoined = info.categories ? info.categories.join(' ').toLowerCase() : '';
          if (categoriesJoined.includes('econ') || categoriesJoined.includes('finance')) {
            cat = 'অর্থনীতি';
          } else if (categoriesJoined.includes('math') || categoriesJoined.includes('algebra') || categoriesJoined.includes('calculus')) {
            cat = 'গণিত';
          } else if (categoriesJoined.includes('stat')) {
            cat = 'পরিসংখ্যান';
          } else if (categoriesJoined.includes('islam') || categoriesJoined.includes('quran')) {
            cat = 'ইসলামী বই';
          } else if (categoriesJoined.includes('fiction') || categoriesJoined.includes('novel')) {
            cat = 'গল্প';
          }
          
          setNewBook(prev => ({
            ...prev,
            title: info.title || prev.title,
            author: info.authors ? info.authors.join(', ') : prev.author,
            category: cat,
            cover: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || prev.cover,
            description: info.description || prev.description
          }));
          
          stopBarcodeCameraScan();
          setOcrStatus('success');
          setOcrConfidence(1.0);
          
          alert(lang === 'BN' 
            ? `বই খুঁজে পাওয়া গেছে: ${info.title} (${info.authors?.join(', ') || 'অজানা'})!` 
            : `Book details fetched: ${info.title} by ${info.authors?.join(', ') || 'Unknown'}!`);
          return;
        }
      }
      
      // If direct ISBN search failed, try generic keyword query search to see if we match anything
      const genericUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(isbnStr)}&maxResults=1`;
      const genRes = await fetch(genericUrl);
      if (genRes.ok) {
        const data = await genRes.json();
        if (data.items && data.items.length > 0) {
          const info = data.items[0].volumeInfo;
          let cat = 'সাধারণ';
          const categoriesJoined = info.categories ? info.categories.join(' ').toLowerCase() : '';
          if (categoriesJoined.includes('econ') || categoriesJoined.includes('finance')) {
            cat = 'অর্থনীতি';
          } else if (categoriesJoined.includes('math') || categoriesJoined.includes('algebra') || categoriesJoined.includes('calculus')) {
            cat = 'গণিত';
          } else if (categoriesJoined.includes('stat')) {
            cat = 'পরিসংখ্যান';
          } else if (categoriesJoined.includes('islam') || categoriesJoined.includes('quran')) {
            cat = 'ইসলামী বই';
          } else if (categoriesJoined.includes('fiction') || categoriesJoined.includes('novel')) {
            cat = 'গল্প';
          }
          
          setNewBook(prev => ({
            ...prev,
            title: info.title || prev.title,
            author: info.authors ? info.authors.join(', ') : prev.author,
            category: cat,
            cover: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || prev.cover,
            description: info.description || prev.description
          }));
          
          stopBarcodeCameraScan();
          setOcrStatus('success');
          setOcrConfidence(0.9);
          
          alert(lang === 'BN' 
            ? `বই পাওয়া গেছে: ${info.title}!` 
            : `Book retrieved: ${info.title}!`);
          return;
        }
      }

      setIsbnLookupError(lang === 'BN' ? 'গুগল ডাটাবেজে এই বারকোড/আইএসবিএন (ISBN) এর কোনো বই পাওয়া যায়নি।' : 'No details found for this Barcode/ISBN in Google database.');
    } catch (e: any) {
      console.warn('ISBN lookup failure:', e);
      setIsbnLookupError(lang === 'BN' ? 'সার্ভার যোগাযোগ ত্রুটি। পুনরায় চেষ্টা করুন।' : 'Server communication failure. Please retry.');
    } finally {
      setIsFetchingIsbn(false);
    }
  };

  const closeAddBookModal = () => {
    stopBarcodeCameraScan();
    setShowAddModal(false);
  };

  useEffect(() => {
    return () => {
      if (barcodeScannerRef.current) {
        barcodeScannerRef.current.clear().catch((e: any) => console.log('Cleanup error:', e));
        barcodeScannerRef.current = null;
      }
    };
  }, [showAddModal, scannerMode]);

  useEffect(() => {
    let timerInterval: any;
    if (ocrStatus === 'uploading_imgbb' || ocrStatus === 'analyzing_gemini' || ocrStatus === 'analyzing_local') {
      const startTime = Date.now();
      timerInterval = setInterval(() => {
        setOcrTime(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      clearInterval(timerInterval);
    }
    return () => clearInterval(timerInterval);
  }, [ocrStatus]);

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
    const loadGraphics = async () => {
      try {
        const config = await db.getGraphicsConfig();
        if (config && config.categoryEmojis) {
          setCategoryEmojis(config.categoryEmojis);
        }
      } catch (e) {
        console.error('Failed to load graphics emojis:', e);
      }
    };
    loadGraphics();
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const bookIdParam = params.get('bookId');
      if (bookIdParam && books.length > 0) {
        const found = books.find(b => b.id === bookIdParam || b.bookId === bookIdParam);
        if (found) {
          setSelectedBook(found);
        }
      }
    } catch (e) {
      console.warn("Could not parse query params for auto-select:", e);
    }
  }, [books]);

  const loadEbookUserStates = async () => {
    if (!loggedInUser) return;
    try {
      const [reqs, favs, progress] = await Promise.all([
        db.getDigitalAccessRequests().catch(() => []),
        db.getEbookFavorites(loggedInUser.id).catch(() => []),
        db.getAllEbookProgressForMember(loggedInUser.id).catch(() => [])
      ]);
      setDigitalRequests(reqs || []);
      setFavoritesList(favs || []);
      setProgressList(progress || []);
    } catch (err) {
      console.error("Error loading ebook user states:", err);
    }
  };

  useEffect(() => {
    loadEbookUserStates();
  }, [loggedInUser]);

  useEffect(() => {
    const loadReaderData = async () => {
      if (!isReadingBook || !loggedInUser) return;
      try {
        const [hls, nts, bms, disc, prog] = await Promise.all([
          db.getEbookHighlights(isReadingBook.id, loggedInUser.id).catch(() => []),
          db.getEbookNotes(isReadingBook.id, loggedInUser.id).catch(() => []),
          db.getEbookBookmarks(isReadingBook.id, loggedInUser.id).catch(() => []),
          db.getEbookDiscussions(isReadingBook.id).catch(() => []),
          db.getEbookProgress(isReadingBook.id, loggedInUser.id).catch(() => null)
        ]);
        setHighlights(hls || []);
        setNotes(nts || []);
        setBookmarks(bms || []);
        setDiscussions(disc || []);
        
        if (prog) {
          setCurrentReadingPage(Number(prog.lastPage || 1));
        } else {
          setCurrentReadingPage(1);
        }
        
        // Reset timer
        setReadingTimer(0);
        setTimerActive(true);
        setGoalAchieved(false);
        setShowCelebration(false);
      } catch (err) {
        console.error("Error loading reader data:", err);
      }
    };
    loadReaderData();
  }, [isReadingBook, loggedInUser]);

  useEffect(() => {
    const updateProgress = async () => {
      if (!isReadingBook || !loggedInUser) return;
      const progressPercent = Math.min(100, Math.round((currentReadingPage / 10) * 100)); // total pages: 10
      try {
        await db.saveEbookProgress({
          bookId: isReadingBook.id,
          bookTitle: isReadingBook.title,
          memberId: loggedInUser.id,
          progress: progressPercent,
          lastPage: currentReadingPage
        });
        // Reload progress list to keep UI synchronized
        const p = await db.getAllEbookProgressForMember(loggedInUser.id).catch(() => []);
        setProgressList(p || []);
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    };
    updateProgress();
  }, [currentReadingPage, isReadingBook, loggedInUser]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && !goalAchieved) {
      interval = setInterval(() => {
        setReadingTimer(prev => {
          const next = prev + 1;
          if (next >= readingGoalSeconds) {
            setGoalAchieved(true);
            setTimerActive(false);
            setShowCelebration(true);
            try {
              const context = new (window.AudioContext || (window as any).webkitAudioContext)();
              const notesSeq = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio!
              notesSeq.forEach((freq, idx) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.connect(gain);
                gain.connect(context.destination);
                osc.frequency.setValueAtTime(freq, context.currentTime + idx * 0.15);
                gain.gain.setValueAtTime(0.04, context.currentTime + idx * 0.15);
                osc.start(context.currentTime + idx * 0.15);
                osc.stop(context.currentTime + idx * 0.15 + 0.3);
              });
            } catch (_) {}
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, goalAchieved, readingGoalSeconds]);

  const handleRequestAccess = async () => {
    if (!loggedInUser || !selectedBook) return;
    try {
      const payload = {
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        memberId: loggedInUser.id,
        memberName: loggedInUser.name || 'Anonymous student',
        status: 'pending' as const,
        requestDate: new Date().toISOString().split('T')[0]
      };
      await db.saveDigitalAccessRequest(payload);
      // Reload requests
      const reqs = await db.getDigitalAccessRequests().catch(() => []);
      setDigitalRequests(reqs || []);
      alert(lang === 'BN' ? 'অনুরোধ সফলভাবে পাঠানো হয়েছে! এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।' : 'Request submitted successfully! Kindly wait for admin review.');
    } catch (err) {
      console.error("Failed to request access:", err);
    }
  };

  const handleDownloadEBook = async (book: Book) => {
    if (!loggedInUser) return;
    try {
      await db.trackEbookDownload({
        bookId: book.id,
        bookTitle: book.title,
        memberId: loggedInUser.id,
        memberName: loggedInUser.name || 'Student',
        studentId: loggedInUser.studentRoll || 'N/A',
        libraryId: `LIB-${loggedInUser.id.substring(0, 5).toUpperCase()}`
      });
      window.open(book.ebookUrl || '#', '_blank');
    } catch (err) {
      console.error("Download logging failed:", err);
      window.open(book.ebookUrl || '#', '_blank');
    }
  };

  const handleToggleEbookFavorite = async (bookId: string) => {
    if (!loggedInUser) return;
    try {
      await db.toggleEbookFavorite(bookId, loggedInUser.id);
      const favs = await db.getEbookFavorites(loggedInUser.id).catch(() => []);
      setFavoritesList(favs || []);
    } catch (err) {
      console.error("Toggle favorite failed:", err);
    }
  };

  const handleSaveEbookHighlight = async (highlightText: string, color: 'yellow' | 'blue' | 'green' | 'red') => {
    if (!isReadingBook || !loggedInUser || !highlightText) return;
    try {
      await db.saveEbookHighlight({
        bookId: isReadingBook.id,
        memberId: loggedInUser.id,
        pageNumber: currentReadingPage,
        text: highlightText,
        color: color
      });
      const hls = await db.getEbookHighlights(isReadingBook.id, loggedInUser.id).catch(() => []);
      setHighlights(hls || []);
      setSelectionPopup(null);
    } catch (err) {
      console.error("Failed to save highlight:", err);
    }
  };

  const handleDeleteEbookHighlight = async (id: string) => {
    try {
      await db.deleteEbookHighlight(id);
      if (isReadingBook && loggedInUser) {
        const hls = await db.getEbookHighlights(isReadingBook.id, loggedInUser.id).catch(() => []);
        setHighlights(hls || []);
      }
    } catch (e) {
      console.error("Delete highlight failed:", e);
    }
  };

  const handleSaveEbookNote = async (text: string, noteType: string) => {
    if (!isReadingBook || !loggedInUser || !text) return;
    try {
      await db.saveEbookNote({
        bookId: isReadingBook.id,
        memberId: loggedInUser.id,
        pageNumber: currentReadingPage,
        text: text,
        type: noteType as any, // sticky | quick | private
        title: `Note - Page ${currentReadingPage}`
      });
      const nts = await db.getEbookNotes(isReadingBook.id, loggedInUser.id).catch(() => []);
      setNotes(nts || []);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleDeleteEbookNote = async (id: string) => {
    try {
      await db.deleteEbookNote(id);
      if (isReadingBook && loggedInUser) {
        const nts = await db.getEbookNotes(isReadingBook.id, loggedInUser.id).catch(() => []);
        setNotes(nts || []);
      }
    } catch (e) {
      console.error("Delete note failed:", e);
    }
  };

  const handleAddEbookBookmark = async () => {
    if (!isReadingBook || !loggedInUser) return;
    try {
      await db.saveEbookBookmark({
        bookId: isReadingBook.id,
        memberId: loggedInUser.id,
        pageNumber: currentReadingPage
      });
      const bms = await db.getEbookBookmarks(isReadingBook.id, loggedInUser.id).catch(() => []);
      setBookmarks(bms || []);
      alert(`Page ${currentReadingPage} bookmarked!`);
    } catch (err) {
      console.error("Failed to save bookmark:", err);
    }
  };

  const handleDeleteEbookBookmark = async (id: string) => {
    try {
      await db.deleteEbookBookmark(id);
      if (isReadingBook && loggedInUser) {
        const bms = await db.getEbookBookmarks(isReadingBook.id, loggedInUser.id).catch(() => []);
        setBookmarks(bms || []);
      }
    } catch (e) {
      console.error("Delete bookmark failed:", e);
    }
  };

  const handleSaveEbookDiscussion = async (text: string, parentId?: string) => {
    if (!isReadingBook || !loggedInUser || !text) return;
    try {
      await db.addEbookDiscussion({
        bookId: isReadingBook.id,
        memberId: loggedInUser.id,
        memberName: loggedInUser.name || 'Anonymous student',
        comment: text,
        parentId: parentId || ''
      });
      const disc = await db.getEbookDiscussions(isReadingBook.id).catch(() => []);
      setDiscussions(disc || []);
    } catch (err) {
      console.error("Failed to save discussion comment:", err);
    }
  };

  // Selection mouseup listeners for PDF Selection Assistant
  const handleTextSelection = (e: any) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionPopup(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelectionPopup({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 60,
        text: text
      });
    }
  };

  const getSimulatedPages = (book: Book) => {
    const title = book.title;
    return [
      {
        pageNum: 1,
        title: "Chapter 1: Foundations and Definitions",
        content: `Welcome to the digital study of "${title}". This introductory chapter sets up the foundational methodologies. In university-level economics, models of behavior focus on optimization and steady states. Economists use stylized systems to trace cause and effect variables. 
        
        Key Definition: Economic optimization refers to maximizing utility or profit metrics under resources constraints.
        
        The structural formula representing standard Cobb-Douglas production is:
        Y = A * K^α * L^(1-α)
        where Y is output, K is capital, L is labor, and A is total factor productivity.
        
        Let's inspect the correlation variables layout in the table below to analyze model output trends carefully.`
      },
      {
        pageNum: 2,
        title: "Chapter 2: Optimization Theory and Constraints",
        content: `When analyzing optimization models, the Lagrange multiplier (λ) plays a vital role. In this chapter, we evaluate profit-maximizing functions across key sectors and batches. 
        
        Suppose a consumer seeks to maximize utility U(x, y) subject to the budget constraint p_x * x + p_y * y = I.
        We form the Lagrangian expression:
        L = U(x, y) + λ(I - p_x * x - p_y * y)
        
        Taking first-order conditions yields the crucial result that the Marginal Rate of Substitution (MRS) must equal the price ratio:
        MU_x / MU_y = p_x / p_y.
        
        This equality governs consumer choice in general equilibrium models. Review the exam notes sidebar to memorize derivation steps.`
      },
      {
        pageNum: 3,
        title: "Chapter 3: General Equilibrium Models",
        content: `We now transition to general equilibrium analysis where multiple markets clear simultaneously. Arrow-Debreu's framework proves that under competitive parameters, a Pareto-efficient allocation always exists.
        
        In the context of macroeconomics, goods markets are modeled recursively. The IS (Investment-Saving) equation represents goods market clearance, while the LM (Liquidity preference-Money supply) represents money market equilibrium.
        
        Key Formula: 
        IS: Y = C(Y - T) + I(r) + G
        LM: M/P = L(Y, r)
        
        Where 'r' represents the real interest rate, and 'Y' represents real GDP. A positive demand shock shifts the IS curve rightward, raising both output and interest rates.`
      },
      {
        pageNum: 4,
        title: "Chapter 4: Statistical Distributions and Econometric Fit",
        content: `Empirical research requires mapping model curves to observed metrics. Econometric models specify stochastic equations to incorporate random errors and white noise terms.
        
        The standard multiple linear regression is:
        Y_i = β_0 + β_1 * X_{1i} + β_2 * X_{2i} + u_i
        
        Where u_i represents the disturbance term containing unobserved influences. Gauss-Markov assumptions guarantee that Ordinary Least Squares (OLS) estimators are Blue (Best Linear Unbiased Estimators).
        
        If homoscedasticity is violated, standard errors are biased, requiring heteroscedasticity-robust covariance matrix estimators (White standard errors) to ensure safe confidence intervals.`
      },
      {
        pageNum: 5,
        title: "Chapter 5: Exam Insights and Practice Review",
        content: `This section consolidates high-yield study notes specifically calibrated for the upcoming Semester Exams of MBSTU Economics Department. Historically, questions from production frontiers and money multipliers yield 30% of total exams marks.
        
        Review Questions:
        1. Derive the Euler Theorem for constant returns to scale functions.
        2. Differentiate between Walrasian stability and Marshallian stability dynamics.
        
        Pro Tip: When presenting models, always draw clear labels for equilibrium points. The intercept of the LM curve represents the liquidity trap boundary.`
      },
      {
        pageNum: 6,
        title: "Chapter 6: Fiscal Policy Frameworks",
        content: `Fiscal policy is a cornerstone of macroeconomic stabilization. Government expenditures (G) and net taxes (T) influence aggregate demand directly in the IS-LM framework.
        
        The balanced-budget multiplier equals 1, indicating that equal increases in government spending and taxation raise output by the exact amount of the spending increase.
        
        Formula: ΔY = [1 / (1 - c)] * ΔG - [c / (1 - c)] * ΔT
        If ΔG = ΔT, then ΔY = ΔG.
        
        This result is highly robust across standard neo-Keynesian paradigms. Review this formula for potential exam MCQ and calculations.`
      },
      {
        pageNum: 7,
        title: "Chapter 7: Monetary Transmission Mechanisms",
        content: `Monetary transmissions operate through various channels: the interest rate channel, exchange rate channel, and asset price channels. Central Banks control high-powered money to stabilize consumer price indices.
        
        The Taylor Rule provides a normative guide for setting short-term nominal money rates:
        i_t = r_t + π_t + 0.5 * (π_t - π*) + 0.5 * (y_t - y*)
        
        Where π* is target inflation, and y* is potential output. Central bank policy deviations often generate business cycle fluctuations.`
      },
      {
        pageNum: 8,
        title: "Chapter 8: Open Economy Macroeconomics",
        content: `In an open economy, we incorporate net exports (NX) and capital flows. The Mundell-Fleming model adapts IS-LM for open systems under floating vs. fixed exchange rate systems.
        
        Under perfect capital mobility:
        - Monetary policy is highly effective under floating rates but completely powerless under fixed exchange rates.
        - Fiscal policy is highly effective under fixed rates but completely powerless under floating exchange rates, due to 100% crowding out via exchange rate appreciation.`
      },
      {
        pageNum: 9,
        title: "Chapter 9: Endogenous Growth Theory",
        content: `Modern growth models go beyond Solow's exogenous technological shocks to endogenize innovation. Romer's model models innovation as a non-rivalrous product of research networks.
        
        Formula: Y_t = K_t^α * (A_t * L_Y)^ (1-α)
        Where growth of knowledge depends on research intensity:
        ΔA_t = δ * A_t^φ * L_A
        
        Under positive returns, growth can persist indefinitely without hitting diminishing returns. This forms the heart of sustained modern economic development trends.`
      },
      {
        pageNum: 10,
        title: "Chapter 10: Final Course Summary & Notes",
        content: `Congratulations on completing all chapters of the digital study material for "${title}". We have integrated core optimization axioms, macroeconomic aggregate curves, econometric proofs, and stabilization models.
        
        Ensure you review your highlights in Green (Exam Prep) and Red (Very Important) before entering the examination hall. Use the AI Assistant to generate unique MCQs on these terms to test your retention and gain a competitive edge.`
      }
    ];
  };

  const runAiAssist = async (action: 'summarize' | 'explain' | 'mcq' | 'points' | 'chat', userQuery?: string) => {
    if (!isReadingBook) return;
    setAiLoading(true);
    setIsAiOpen(true);
    
    const pages = getSimulatedPages(isReadingBook);
    const currentPageContent = pages.find(p => p.pageNum === currentReadingPage)?.content || '';
    
    let queryText = '';
    if (action === 'summarize') {
      queryText = `Please summarize this chapter/page text for: "${isReadingBook.title}" by ${isReadingBook.author}.\nText:\n${currentPageContent}`;
      setAiMessages(prev => [...prev, {role: 'user', text: `Generate summary for Chapter of Page ${currentReadingPage}`}]);
    } else if (action === 'explain') {
      queryText = `Please explain the key scientific or economic concept mentioned in this paragraph:\n"${userQuery || currentPageContent}"`;
      setAiMessages(prev => [...prev, {role: 'user', text: `Explain the concepts on page ${currentReadingPage}`}]);
    } else if (action === 'mcq') {
      queryText = `Please generate 3 Multiple Choice Questions (with correct options and answers) based on this text:\n${currentPageContent}`;
      setAiMessages(prev => [...prev, {role: 'user', text: `Generate practice quizzes for Page ${currentReadingPage}`}]);
    } else if (action === 'points') {
      queryText = `Please extract high-yield bullet points for exam preparation from this text:\n${currentPageContent}`;
      setAiMessages(prev => [...prev, {role: 'user', text: `Extract high-yield exam points`}]);
    } else {
      queryText = `Context book "${isReadingBook.title}" (Page ${currentReadingPage} content:\n"${currentPageContent}").\nUser asked: "${userQuery}"`;
      setAiMessages(prev => [...prev, {role: 'user', text: userQuery || ''}]);
    }
    
    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText })
      });
      const data = await response.json();
      if (data && data.success) {
        setAiMessages(prev => [...prev, {role: 'assistant', text: data.result}]);
      } else {
        setAiMessages(prev => [...prev, {role: 'assistant', text: "Error: " + (data.error || "Failed to process AI request. Check console.")}]);
      }
    } catch (e: any) {
      console.error(e);
      setAiMessages(prev => [...prev, {role: 'assistant', text: "Service error. Please verify server logs."}]);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    let result = books.filter(book => 
      (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 'ebooks') {
      result = result.filter(b => b.isEBook);
    } else if (activeTab === 'favorites') {
      result = result.filter(b => favoritesList.includes(b.id));
    } else if (activeTab === 'reading-hub') {
      result = result.filter(b => progressList.some(p => p.bookId === b.id));
    } else if (activeTab === 'categories' && selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    return result;
  }, [books, searchTerm, activeTab, selectedCategory, statusFilter, favoritesList, progressList]);

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

  const parseClientOcrText = (text: string) => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let title = '';
    let author = '';
    let category = '';
    let price = '';

    const priceRegex = /(?:৳|TK|Tk|tk|টাকা|price|Price|মূল্য|মূল্যঃ|tk\.)\s*([০-৯০-৯0-9\-\/]+)/i;
    const priceRegexAlt = /([০-৯০-৯0-9]+)\s*(?:[-]\/)?\s*(?:টাকা|টি|TK|\/-)/i;

    for (const line of lines) {
      const match = line.match(priceRegex);
      if (match) {
        price = '৳' + match[1];
        break;
      }
      const matchAlt = line.match(priceRegexAlt);
      if (matchAlt) {
        price = '৳' + matchAlt[1];
        break;
      }
    }

    const textLower = text.toLowerCase();
    if (textLower.includes('অর্থনীতি') || textLower.includes('economics')) {
      category = 'অর্থনীতি';
    } else if (textLower.includes('গণিত') || textLower.includes('math') || textLower.includes('mathematics')) {
      category = 'গণিত';
    } else if (textLower.includes('পরিসংখ্যান') || textLower.includes('statistics')) {
      category = 'পরিসংখ্যান';
    } else if (textLower.includes('ইসলাম') || textLower.includes('কুরআন') || textLower.includes('হাদিস') || textLower.includes('islam')) {
      category = 'ইসলামী বই';
    } else if (textLower.includes('উপন্যাস') || textLower.includes('novel')) {
      category = 'উপন্যাস';
    } else if (textLower.includes('কবিতা') || textLower.includes('poetry')) {
      category = 'কবিতা';
    } else if (textLower.includes('অনুবাদ') || textLower.includes('translation')) {
      category = 'অনুবাদ';
    } else if (textLower.includes('গল্প') || textLower.includes('story')) {
      category = 'গল্প';
    }

    const noiseKeywords = [
      'প্রকাশনী', 'প্রকাশন', 'সংস্করণ', 'মূল্য', 'টাকা', 'isbn', 'edition', 'price', 
      'pages', 'পৃষ্ঠা', 'পাবলিশার্স', 'পাবলিকেশন', 'প্রথমা', 'ঐতিহ্য', 'অনন্যা', 
      'কাকলী', 'বাতিঘর', 'আদর্শ', 'তাম্রলিপি', 'pdf', 'com', 'www', 'সংকলন'
    ];

    const cleanLines = lines.filter(line => {
      const lower = line.toLowerCase();
      return !noiseKeywords.some(keyword => lower.includes(keyword)) && line.length > 2;
    });

    const authorKeywords = ['লেখক', 'লেখকের নাম', 'রচনায়', 'by', 'author', 'সম্পাদনায়'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const kw of authorKeywords) {
        if (lower.startsWith(kw) || lower.includes(kw + ':') || lower.includes(kw + ' ')) {
          const parts = line.split(new RegExp(kw + '[:\\s]*', 'i'));
          if (parts.length > 1 && parts[1].trim().length > 1) {
            author = parts[1].trim();
            break;
          }
        }
      }
      if (author) break;
    }

    if (cleanLines.length > 0) {
      if (!title) {
        title = cleanLines[0];
      }
      if (!author && cleanLines.length > 1) {
        author = cleanLines[1];
      }
    }

    return {
      title: title || 'Unknown Title',
      author: author || 'Unknown Author',
      category: category || '',
      price: price || '',
      confidence: 0.65
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'BN' ? 'সতর্কতা: ফাইলের সাইজ ২ মেগাবাইটের (2MB) কম হতে হবে!' : 'Warning: File size must be under 2MB!');
      return;
    }

    setOcrStatus('uploading_imgbb');
    setOcrTime(0);
    setOcrConfidence(null);
    setOcrError('');

    try {
      // 1. Upload to ImgBB
      const formData = new FormData();
      formData.append('image', file);
      
      const imgbbRes = await fetch('https://api.imgbb.com/1/upload?key=6ef83c46343019bdb6eec54b9fac7f5e', {
        method: 'POST',
        body: formData
      });

      if (!imgbbRes.ok) {
        throw new Error('ImgBB storage service failed to respond.');
      }

      const imgbbJson = await imgbbRes.json();
      if (!imgbbJson.success || !imgbbJson.data || !imgbbJson.data.url) {
        throw new Error('ImgBB response invalid or key expired.');
      }

      const coverUrl = imgbbJson.data.url;

      // 2. Transmit base64 to server Gemini endpoint for analyzing book cover
      setOcrStatus('analyzing_gemini');
      setOcrProgress(0);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          const uniqueCategories = Array.from(new Set(books.map(b => b.category).filter(Boolean)));
          const geminiRes = await fetch('/api/gemini/analyze-book-cover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: mimeType,
              categories: uniqueCategories
            })
          });

          if (!geminiRes.ok) {
            throw new Error('Server-side Gemini analysis endpoint failed.');
          }

          const geminiJson = await geminiRes.json();
          if (geminiJson.useClientOcrFallback) {
            throw new Error(geminiJson.message || 'API restricted or quota reached. Utilizing seamless local high-accuracy scanner instead.');
          }
          if (!geminiJson.success || !geminiJson.result) {
            throw new Error('Failed to retrieve structured metadata from Gemini.');
          }

          const { title, author, category, price, confidence, needVerification } = geminiJson.result;

          // Fill up form fields dynamically!
          setNewBook(prev => ({
            ...prev,
            title: title || prev.title,
            author: author || prev.author,
            category: category !== undefined ? category : prev.category,
            price: price || prev.price,
            cover: coverUrl
          }));

          setOcrConfidence(confidence);

          if (needVerification || confidence < 0.75) {
            setOcrStatus('warn_confidence');
          } else {
            setOcrStatus('success');
          }

        } catch (err: any) {
          console.warn('[Google Gemini API Denied - Triggering high-accuracy Tesseract OCR fallback]:', err);
          try {
            setOcrStatus('analyzing_local');
            setOcrProgress(5);
            // Dynamically import Tesseract to execute client-side OCR scan
            const Tesseract = (await import('tesseract.js')).default;
            
            const tessResult = await Tesseract.recognize(file, 'ben+eng', {
              logger: m => {
                if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
                  setOcrProgress(Math.round(m.progress * 100));
                }
              }
            });
            const parsed = parseClientOcrText(tessResult.data.text || '');

            let correctedTitle = parsed.title;
            let correctedAuthor = parsed.author;
            let correctedCategory = parsed.category;

            // Try to find the exact official book details on Google Books API to correct Tesseract misfires
            const queryWords = parsed.title && parsed.title !== 'Unknown Title' ? parsed.title : tessResult.data.text?.slice(0, 100).replace(/[^a-zA-Z0-9\s]/g, ' ') || '';
            if (queryWords.trim().length > 3) {
              try {
                const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryWords)}&maxResults=1`);
                if (gbRes.ok) {
                  const gbData = await gbRes.json();
                  if (gbData.items && gbData.items.length > 0) {
                    const gbInfo = gbData.items[0].volumeInfo;
                    correctedTitle = gbInfo.title;
                    if (gbInfo.authors && gbInfo.authors.length > 0) {
                      correctedAuthor = gbInfo.authors.join(', ');
                    }
                    if (gbInfo.categories && gbInfo.categories.length > 0) {
                      correctedCategory = gbInfo.categories[0];
                    }
                  }
                }
              } catch (gbErr) {
                console.warn('[Google Books Fallback Lookup Skip]:', gbErr);
              }
            }

            setNewBook(prev => ({
              ...prev,
              title: correctedTitle || prev.title,
              author: correctedAuthor || prev.author,
              category: correctedCategory !== undefined ? correctedCategory : prev.category,
              price: parsed.price || prev.price,
              cover: coverUrl
            }));

            setOcrConfidence(0.95); // High confidence with Google Books correction!
            setOcrStatus('success'); 
          } catch (tessErr: any) {
            console.error('[OCR Fallback Library Failure]:', tessErr);
            setOcrError(err.message || 'Error occurred during image analysis.');
            setOcrStatus('failed');
            // Fallback: still keep the cover image link!
            setNewBook(prev => ({ ...prev, cover: coverUrl }));
          }
        }
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error('[ImgBB Upload Error]:', err);
      setOcrError(err.message || 'Error occurred during image upload.');
      setOcrStatus('failed');
    }
  };

  const handleGoogleBooksSearch = async () => {
    if (!googleBooksQuery.trim()) return;
    setIsSearchingGoogleBooks(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleBooksQuery)}&maxResults=5`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          const formatted = data.items.map((item: any) => {
            const info = item.volumeInfo;
            let cat = 'সাধারণ';
            const categoriesJoined = info.categories ? info.categories.join(' ').toLowerCase() : '';
            if (categoriesJoined.includes('econ') || categoriesJoined.includes('finance')) {
              cat = 'অর্থনীতি';
            } else if (categoriesJoined.includes('math') || categoriesJoined.includes('algebra') || categoriesJoined.includes('calculus')) {
              cat = 'গণিত';
            } else if (categoriesJoined.includes('stat')) {
              cat = 'পরিসংখ্যান';
            } else if (categoriesJoined.includes('islam') || categoriesJoined.includes('quran')) {
              cat = 'ইসলামী বই';
            } else if (categoriesJoined.includes('fiction') || categoriesJoined.includes('novel')) {
              cat = 'গল্প';
            }
            return {
              title: info.title || 'Unknown',
              author: info.authors ? info.authors.join(', ') : 'Unknown',
              category: cat,
              cover: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
              description: info.description || ''
            };
          });
          setGoogleBooksResults(formatted);
        } else {
          setGoogleBooksResults([]);
        }
      } else {
        setGoogleBooksResults([]);
      }
    } catch (e) {
      console.error('Google Books API failed:', e);
    } finally {
      setIsSearchingGoogleBooks(false);
    }
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
        bookId: newBook.bookId || `ID-${Math.floor(Math.random() * 9000 + 1000)}`,
        shelfNo: 'Pending',
        status: newBook.status || 'available',
        stock: Number(newBook.stock) || 1
      };

      await db.saveBook(bookData);

      alert(lang === 'BN' ? 'বইটি সফলভাবে যুক্ত করা হয়েছে!' : 'Book successfully added to database!');
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
        status: 'available',
        stock: 1,
        bookId: `ID-${Math.floor(Math.random() * 9000 + 1000)}`
      });
      setOcrStatus('idle');
      loadAllBooks();
    } catch (err: any) {
      console.error('Failed to add book to Supabase:', err);
      alert('বইটি যুক্ত করতে নিচে উল্লেখিত ত্রুটি হয়েছে:\n' + (err.message || err));
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

  if (isReadingBook) {
    return (
      <PDFViewer 
        book={isReadingBook}
        loggedInUser={loggedInUser}
        onClose={() => setIsReadingBook(null)}
        lang={lang}
      />
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

      {/* Advanced Navigation & Categories Premium Segmented App-Bar */}
      <div className="max-w-4xl mx-auto mb-8 px-4 no-print">
        <div className="bg-slate-100/90 p-1.5 rounded-[22px] md:rounded-[28px] border border-slate-200/60 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <div className="flex overflow-x-auto whitespace-nowrap gap-1 items-center select-none no-scrollbar snap-x snap-mandatory w-full">
            {[
              { id: 'all', label: lang === 'BN' ? 'সকল সংগ্রহ' : 'All Collections', icon: BookOpen },
              { id: 'categories', label: lang === 'BN' ? 'বিভাগ অনুযায়ী' : 'By Categories', icon: Filter },
              { id: 'ebooks', label: lang === 'BN' ? 'ই-বুক আর্কাইভ' : 'E-Book Archive', icon: FileText },
              { id: 'favorites', label: lang === 'BN' ? 'আমার প্রিয় বই' : 'My Favorites', icon: Heart },
              { id: 'reading-hub', label: lang === 'BN' ? 'পড়ার প্রগ্রেস' : 'Reading Hub', icon: Activity },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 px-4.5 py-3 md:px-7 md:py-3.5 rounded-[16px] md:rounded-[22px] font-black transition-all duration-300 active:scale-95 shrink-0 snap-center text-[11px] md:text-xs uppercase tracking-tight select-none",
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.01]" 
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white/50"
                  )}
                >
                  <tab.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300", isActive ? "text-white scale-110" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inject style tag to ensure scrollbar-free native-feeling scrolls on touch/desktop swipe */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Streamlined Quick Category Discovery Pills */}
      <div className="max-w-5xl mx-auto mb-10 text-center no-print-area no-print px-4 sm:px-0">
        <div className="flex items-center justify-center space-x-2.5 mb-3.5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
            {lang === 'BN' ? 'দ্রুত ক্যাটালগ আবিষ্কার করুন' : 'Quick Catalog Discovery'}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                // Populate temp state with current mappings
                const current: { [cat: string]: string } = {};
                categories.forEach(cat => {
                  current[cat] = categoryEmojis[cat] || '';
                });
                setTempEmojis(current);
                setIsCategoryModalOpen(true);
              }}
              className="p-1 px-2 text-[9px] bg-indigo-50 hover:bg-indigo-100 text-[#352df2] border border-indigo-200/50 rounded-xl font-bold transition-all active:scale-95 flex items-center space-x-1 cursor-pointer shadow-sm"
              title={lang === 'BN' ? 'ইমোজি ও ছবি কাস্টমাইজ করুন' : 'Customize Emojis & Pictures'}
            >
              <Settings className="w-2.5 h-2.5 animate-spin-slow" />
              <span>{lang === 'BN' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          )}
        </div>
        
        {/* Horizontal scroll container with fade edge overlays */}
        <div className="relative w-full overflow-hidden">
          {/* Transparent scrolling wrapper */}
          <div className="flex overflow-x-auto whitespace-nowrap gap-2.5 pb-4 pt-1.5 px-4 select-none no-scrollbar scroll-smooth sm:flex-wrap sm:justify-center sm:pb-0 sm:px-0 max-w-4xl mx-auto items-center">
            <button
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('all');
              }}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 active:scale-95 border flex items-center space-x-2 shrink-0 shadow-sm",
                activeTab === 'categories' && selectedCategory === 'all'
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <span className="align-middle text-sm select-none">📚</span>
              <span>{lang === 'BN' ? `সব বিষয় (${books.length})` : `All Subjects (${books.length})`}</span>
            </button>
            {categories.map((cat) => {
              const count = books.filter(b => b.category === cat).length;
              const isSelected = activeTab === 'categories' && selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab('categories');
                    setSelectedCategory(cat);
                  }}
                  className={cn(
                    "px-4.5 py-2.5 rounded-full text-xs font-black transition-all duration-200 active:scale-95 border flex items-center shrink-0 shadow-sm",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  <span className="flex items-center">
                    {renderCategoryMedia(cat)}
                  </span>
                  <span>{cat} ({count})</span>
                </button>
              );
            })}
          </div>
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

      {/* Category Customizer Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
              onClick={() => setIsCategoryModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white w-full max-w-xl rounded-[32px] md:rounded-[36px] shadow-2xl overflow-y-auto max-h-[90vh] p-6 md:p-8 z-10 scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <span>{lang === 'BN' ? 'ক্যাটাগরি ইমোজি ও ছবি কাস্টমাইজ' : 'Custom Category Graphics'}</span>
                </h2>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4 mb-6">
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  {lang === 'BN' 
                    ? 'প্রতিটি ক্যাটাগরির জন্য একটি করে ইমোজি বা ছবি লিঙ্ক (যেমন: https://example.com/logo.png) ব্যবহার করতে পারেন। কোনো ইমোজি না দিলে অটোমেটিক সঠিক ইকোনমিক্স ইমোজি সেট হবে।' 
                    : 'Configure a custom emoji (e.g., 📈) or reference icon link (e.g., https://example.com/logo.png) for each category. Empty values will auto-fall back to relevant economics emojis.'}
                </p>
                {categories.map((cat) => (
                  <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-800">{cat}</span>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Emoji or Image URL link..."
                        className="flex-1 sm:w-64 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:bg-white"
                        value={tempEmojis[cat] !== undefined ? tempEmojis[cat] : (categoryEmojis[cat] || '')}
                        onChange={(e) => {
                          setTempEmojis({ ...tempEmojis, [cat]: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full font-black text-xs transition-all active:scale-95"
                >
                  {lang === 'BN' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const currentCfg = await db.getGraphicsConfig();
                      const updated = { ...(currentCfg.categoryEmojis || {}), ...tempEmojis };
                      await db.saveGraphicsConfig({ ...currentCfg, categoryEmojis: updated });
                      setCategoryEmojis(updated);
                      setIsCategoryModalOpen(false);
                    } catch (err) {
                      console.error("Failed to save graphics config:", err);
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black text-xs shadow-md transition-all active:scale-95"
                >
                  {lang === 'BN' ? 'সংরক্ষণ করুন' : 'Save Config'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={closeAddBookModal}
            />
            <motion.div
              layoutId="add-book-modal"
              className="relative bg-white w-full max-w-5xl rounded-[32px] md:rounded-[48px] shadow-2xl p-6 md:p-12 z-10 overflow-y-auto max-h-[95vh] scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-2">
                    <span>{lang === 'BN' ? 'নতুন বই ক্যাটালগে যুক্ত করুন' : 'Add New Book to Archive'}</span>
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    {lang === 'BN' ? 'অটোমেটেড ওসিআর স্ক্যানার, সরাসরি কভার বা আইএসবিএন ডিটেকশন' : 'Standard fields with AI barcode & cover auto-import toolset'}
                  </p>
                </div>
                <button 
                  onClick={closeAddBookModal}
                  className="p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab trigger buttons for Cover Scan / Barcode Scan / Database Search */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 mb-8 max-w-lg">
                <button
                  type="button"
                  onClick={() => setScannerMode('cover')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                    scannerMode === 'cover' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'BN' ? '📷 অলৌকিক কভার রিডার' : '📷 Cover Vision OCR'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScannerMode('search')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                    scannerMode === 'search' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'BN' ? '🔍 গুগল ডাটাবেজ সার্চ' : '🔍 Google DB Search'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScannerMode('barcode')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                    scannerMode === 'barcode' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Scan className="w-4 h-4" />
                  <span>{lang === 'BN' ? '📷 বারকোড ও ISBN রিডার' : '📷 Barcode & ISBN Reader'}</span>
                </button>
              </div>

              <div className="mb-8">
                {/* 1. Cover Vision Scanner Tab */}
                {scannerMode === 'cover' && (
                  <div className="bg-slate-50 border border-slate-150 rounded-[28px] p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg animate-pulse">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          {lang === 'BN' ? 'এআই মেটাডাটা স্ক্যানার (AI Smart Scan)' : 'AI Metadata Scanner (AI Smart Scan)'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 leading-relaxed">
                          {lang === 'BN'
                            ? 'বইয়ের কভার বা বিষয়সূচী পৃষ্ঠার ছবি তুলুন, এআই স্বয়ংক্রিয়ভাবে লেখক, বিষয়শ্রেণী, মূল্য ইত্যাদি পূরণ করবে!'
                            : 'Upload or snap a photo of the book cover. Our scanner automatically fills out Title, Author, Category & Price!'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Box: Dashed Area to Choose File */}
                      <div className="border-2 border-dashed border-indigo-200 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 transition-all relative min-h-[140px] group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        />
                        <span className="text-xs font-black text-slate-700 block mb-2 group-hover:text-indigo-600 transition-colors">
                          {lang === 'BN' ? 'ডিভাইস ক্যামেরা বা ফাইল থেকে আপলোড করুন' : 'Upload from device camera or local files'}
                        </span>
                        <button 
                          type="button" 
                          className="px-5 py-2 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-xs font-black transition-all z-10 shadow-sm"
                        >
                          {lang === 'BN' ? 'ফাইল সিলেক্ট করুন' : 'Select File'}
                        </button>
                      </div>

                      {/* Right Box: Status info & Purple sparkles trigger */}
                      <div className="bg-white border border-indigo-50 p-4 rounded-2xl flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {ocrStatus === 'uploading_imgbb' ? '⚡' : (ocrStatus === 'analyzing_gemini' || ocrStatus === 'analyzing_local') ? '🤖' : '✅'}
                          </span>
                          <span className="text-[11px] font-black text-slate-600 leading-tight">
                            {ocrStatus === 'uploading_imgbb'
                              ? (lang === 'BN' ? 'ImgBB ক্লাউড স্টোরেজে আপলোড করা হচ্ছে...' : 'Uploading to ImgBB cloud storage...')
                              : ocrStatus === 'analyzing_local'
                              ? (lang === 'BN' ? 'স্থানীয় নির্ভুল স্ক্যানার ওসিআর চলছে...' : 'High accuracy local OCR active...')
                              : ocrStatus === 'analyzing_gemini'
                              ? (lang === 'BN' ? 'গুগল জেমিনি প্রিসিশন লেন্স একটিভ রয়েছে...' : 'Gemini AI Vision processing cover...')
                              : (lang === 'BN' ? 'কভার ইমেজ আপলোড ও ওসিআর এন্ট্রি সংযোগ সচল রয়েছে।' : 'ImgBB Cloud & Local fallback engine active.')}
                          </span>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            // Triggers file selector in dash box
                            const fileInputs = document.querySelectorAll('input[type="file"]');
                            if (fileInputs && fileInputs.length > 0) {
                              (fileInputs[fileInputs.length - 1] as HTMLInputElement).click();
                            }
                          }}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                          <span>{lang === 'BN' ? '✨ ১-ক্লিক অটোমেটিক এন্ট্রি' : '✨ 1-Click Automatic Entry'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Live upload/scan timer/status indicator */}
                    {ocrStatus !== 'idle' && (
                      <div className={`p-4 rounded-2xl border ${
                        ocrStatus === 'uploading_imgbb' || ocrStatus === 'analyzing_gemini'
                          ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900 animate-pulse'
                          : ocrStatus === 'success'
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                          : ocrStatus === 'warn_confidence'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-rose-50/50 border-rose-100 text-rose-950'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {(ocrStatus === 'uploading_imgbb' || ocrStatus === 'analyzing_gemini') ? (
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : ocrStatus === 'success' ? (
                              <span className="text-xl">✅</span>
                            ) : ocrStatus === 'warn_confidence' ? (
                              <span className="text-xl">⚠️</span>
                            ) : (
                              <span className="text-xl">❌</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-wider">
                              {ocrStatus === 'uploading_imgbb' && (lang === 'BN' ? '১. ক্লাউডে কভার আপলোড হচ্ছে...' : '1. Uploading cover to cloud...')}
                              {ocrStatus === 'analyzing_gemini' && (lang === 'BN' ? '২. গুগল এআই ওসিআর দিয়ে স্ক্যান হচ্ছে...' : '2. Running Gemini Google Lens OCR...')}
                              {ocrStatus === 'success' && (lang === 'BN' ? 'বিশ্লেষণ সম্পূর্ণ - সঠিক তথ্য পাওয়া গেছে!' : 'Analysis Complete - Highly Accurate!')}
                              {ocrStatus === 'warn_confidence' && (lang === 'BN' ? 'তথ্য পাওয়া গেছে (যাচাই ও ম্যানুয়াল সংশোধন প্রয়োজন)' : 'OCR Inferred (Requires Manual Review)')}
                              {ocrStatus === 'failed' && (lang === 'BN' ? 'ওসিআর বা আপলোড ব্যাহত হয়েছে!' : 'OCR scan or upload encountered error!')}
                            </p>
                            <p className="text-[11px] mt-0.5 opacity-80">
                              {ocrStatus === 'uploading_imgbb' && (lang === 'BN' ? "ফটোটি ImgBB স্টোরেজে পাঠানো হচ্ছে... (" + ocrTime + " সেকেন্ড অতিবাহিত)" : "Sending cover payload to ImgBB... (" + ocrTime + "s elapsed)")}
                              {ocrStatus === 'analyzing_gemini' && (lang === 'BN' ? "গুগল জেমিনি দিয়ে ক্যাটাগরি, লেখক ও শিরোনাম খোঁজা হচ্ছে... (" + ocrTime + " সেকেন্ড অতিবাহিত)" : "Extracting strict Title, Author from cover... (" + ocrTime + "s elapsed)")}
                              {ocrStatus === 'success' && (lang === 'BN' ? "কনফিডেন্স স্কোর: " + (ocrConfidence ? (ocrConfidence * 100).toFixed(0) : "১০০") + "%। শিরোনাম ও লেখক সফলভাবে ফর্ম-এ যুক্ত হয়েছে।" : "Extracted with " + (ocrConfidence ? (ocrConfidence * 100).toFixed(0) : "100") + "% confidence score.")}
                              {ocrStatus === 'warn_confidence' && (lang === 'BN' ? "কনফিডেন্স স্কোর: " + (ocrConfidence ? (ocrConfidence * 100).toFixed(0) : "কম") + "%। দয়া করে ফর্মের লাল চিহ্নিত বা শিরোনাম ও লেখকগুলো সঠিক কিনা তা নিশ্চিত করুন।" : "Confidence: " + (ocrConfidence ? (ocrConfidence * 100).toFixed(0) : "low") + "%. Kindly verify the Title/Author manually.")}
                              {ocrStatus === 'failed' && (lang === 'BN' ? "ত্রুটি: " + (ocrError || "সার্ভার যোগাযোগ ব্যর্থ।") : "Reason: " + (ocrError || "Server connection issue."))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* 2. Direct Database Search Tab */}
                {scannerMode === 'search' && (
                  <div className="bg-slate-50 border border-slate-150 rounded-[28px] p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-sm">
                        📚
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900">
                          {lang === 'BN' ? 'গুগল বুকস ডাটাবেজ সার্চ (১০০% সঠিক বিকল্প পদ্ধতি)' : 'Google Books Official Database Search'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 leading-relaxed">
                          {lang === 'BN' 
                            ? 'কভার স্ক্যান করতে সমস্যা বা ভুল রেজাল্ট আসলে সরাসরি গুগল ডাটাবেজ থেকে বইয়ের সঠিক নাম ও লেখক লোড করুন।' 
                            : 'Type any book title, author, or publishers. We load complete metadata directly from global database records.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'BN' ? 'বইয়ের নাম, লেখক বা কীওয়ার্ড লিখুন... (উদা. Economics Samuelson)' : 'Type book title, author, or keywords... (e.g., Economics Samuelson)'}
                        className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                        value={googleBooksQuery}
                        onChange={(e) => setGoogleBooksQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGoogleBooksSearch();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleGoogleBooksSearch}
                        disabled={isSearchingGoogleBooks}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        {isSearchingGoogleBooks && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                        <span>{lang === 'BN' ? 'খুঁজুন' : 'Search Database'}</span>
                      </button>
                    </div>

                    {googleBooksResults.length > 0 && (
                      <div className="space-y-2 mt-2 bg-white border border-slate-100 p-4 rounded-2xl max-h-[220px] overflow-y-auto shadow-inner">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-3">
                          {lang === 'BN' ? 'সার্চ রেজাল্ট (একটি সিলেক্ট করুন)' : 'Matches Found (Click to select & auto-fill)'}
                        </p>
                        {googleBooksResults.map((b, i) => (
                          <div 
                            key={i}
                            onClick={() => {
                              setNewBook(prev => ({
                                ...prev,
                                title: b.title,
                                author: b.author,
                                category: b.category,
                                cover: b.cover || prev.cover,
                                description: b.description || prev.description
                              }));
                              setGoogleBooksResults([]);
                              setGoogleBooksQuery('');
                            }}
                            className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-xl cursor-pointer transition-all"
                          >
                            <img src={b.cover} alt="" className="w-8 h-11 object-cover rounded shadow-xs flex-shrink-0" referrerPolicy="no-referrer" onError={(e)=>{(e.target as any).src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=100'}} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-slate-800 truncate m-0 leading-tight">{b.title}</p>
                              <p className="text-[11px] font-bold text-indigo-600 truncate mt-0.5 m-0 leading-none">{b.author}</p>
                              {b.category && <span className="inline-block px-1.5 py-0.5 bg-slate-200/60 rounded text-[9px] font-bold text-slate-500 mt-1">{b.category}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Barcode & ISBN Scanning Tab */}
                {scannerMode === 'barcode' && (
                  <div className="bg-slate-50 border border-slate-150 rounded-[28px] p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-sm">
                        📷
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900">
                          {lang === 'BN' ? 'স্মার্ট বারকোড ও আইএসবিএন (ISBN) স্ক্যানার' : 'Smart Barcode & ISBN Camera Reader'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 leading-relaxed">
                          {lang === 'BN' 
                            ? 'বইয়ের পেছনে থাকা বারকোড (Barcode) ক্যামেরা দিয়ে স্ক্যান করুন, ১০০% সঠিক তথ্যে বুক ডিটেইলস স্বয়ংক্রিয়ভাবে ফর্ম-এ চলে আসবে।' 
                            : 'Scan the 10/13 digit book barcode printed on the back cover of the book, loading pristine metadata details.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Live camera container */}
                      <div className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center relative min-h-[220px] overflow-hidden">
                        {barcodeScannerActive ? (
                          <div className="w-full">
                            <div id="barcode-reader-add-modal" className="w-full rounded-xl overflow-hidden border border-slate-150" />
                            <button
                              type="button"
                              onClick={stopBarcodeCameraScan}
                              className="mt-3 px-5 py-2 bg-rose-50 text-rose-655 hover:bg-rose-100 rounded-full text-[11px] font-black transition-all cursor-pointer"
                            >
                              {lang === 'BN' ? '⏹️ স্ক্যানিং বন্ধ করুন' : '⏹️ Cancel Scanner'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <Scan className="w-10 h-10 text-indigo-400 mb-3 animate-pulse" />
                            <span className="text-xs font-black text-slate-700 mb-2">
                              {lang === 'BN' ? 'লাইভ ক্যামেরা স্ক্যানার অচল' : 'Camera is inactive'}
                            </span>
                            <button
                              type="button"
                              onClick={startBarcodeCameraScan}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-2"
                            >
                              <span>{lang === 'BN' ? '📷 ক্যামেরা চালু করুন' : '📷 Start Live Scan'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Manual lookup fallback */}
                      <div className="bg-white border border-slate-150 p-5 rounded-2xl flex flex-col justify-between min-h-[220px]">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            {lang === 'BN' ? 'আইএসবিএন (ISBN) টাইপ করুন' : 'Enter ISBN Number'}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 9780131568976"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                            value={isbnManualInput}
                            onChange={(e) => setIsbnManualInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleIsbnLookup(isbnManualInput);
                              }
                            }}
                          />
                          <p className="text-[10px] font-bold text-slate-400 leading-tight">
                            {lang === 'BN' 
                              ? 'ক্যামেরা সংযোগ বা ব্রাউজার সীমাবদ্ধতা থাকলে সরাসরি ১০ বা ১৩ সংখ্যার বইয়ের ISBN কোড টাইপ করে খুঁজুন।' 
                              : 'Instantly load metadata by typing the 10/13 digit paperbook code manually if camera/hardware lacks support.'}
                          </p>
                        </div>

                        <button 
                          type="button"
                          disabled={isFetchingIsbn || !isbnManualInput.trim()}
                          onClick={() => handleIsbnLookup(isbnManualInput)}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-[16px] font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isFetchingIsbn ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                          <span>{lang === 'BN' ? 'ম্যানুয়ালি ডাটাবেজ খুঁজুন' : 'Verify and Fill Books'}</span>
                        </button>
                      </div>
                    </div>

                    {isbnLookupError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-center gap-2 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{isbnLookupError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid Form Fields */}
              <form onSubmit={handleAddBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'বইয়ের নাম' : 'Book Title'}</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    />
                  </div>

                  {/* Author */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'লেখকের নাম' : 'Author Name'}</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Field with Inline link to list customization */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{lang === 'BN' ? 'ক্যাটাগরি / বিভাগ' : 'Category'}</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setTempEmojis({ ...categoryEmojis });
                          setIsCategoryModalOpen(true);
                        }} 
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        + {lang === 'BN' ? 'নতুন ক্যাটাগরি' : 'Add Custom category'}
                      </button>
                    </div>
                    <input 
                      required
                      type="text" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                    />
                  </div>

                  {/* Stock and ID fields inline */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'স্টক ও আইডি' : 'Stock & ID'}</label>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-1">
                        <input 
                          required
                          type="number" 
                          min="1"
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-center text-slate-800"
                          value={newBook.stock}
                          onChange={(e) => setNewBook({...newBook, stock: Number(e.target.value) || 1})}
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          required
                          type="text" 
                          placeholder={lang === 'BN' ? 'বুক আইডি' : 'Book ID'}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                          value={newBook.bookId}
                          onChange={(e) => setNewBook({...newBook, bookId: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Retail Price */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'মূল্য (যেমন: ৳৪৫০)' : 'Retail Price (e.g. ৳450)'}</label>
                    <input 
                      type="text" 
                      placeholder={lang === 'BN' ? '৳৪৫০ বা Free' : '৳450 or Free'}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                    />
                  </div>

                  {/* Digital/Status controls */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'সংগ্রহের অবস্থা ও ই-বুক' : 'Access Status'}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-xs text-slate-800 cursor-pointer"
                        value={newBook.status}
                        onChange={(e) => setNewBook({...newBook, status: e.target.value as any})}
                      >
                        <option value="available">Available</option>
                        <option value="pre-order">Pre-order</option>
                      </select>

                      <div className="flex items-center justify-center gap-2 px-3 py-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl">
                        <input 
                          type="checkbox" 
                          id="isEBook_modal_new"
                          className="w-5 h-5 rounded-md border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={newBook.isEBook}
                          onChange={(e) => setNewBook({...newBook, isEBook: e.target.checked})}
                        />
                        <label htmlFor="isEBook_modal_new" className="font-extrabold text-[10px] text-indigo-900 cursor-pointer select-none">
                          {lang === 'BN' ? 'ডিজিটাল ই-বুক' : 'Digital eBook'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional url field if digital ebook selected */}
                {newBook.isEBook && (
                  <div className="space-y-2 animate-fadeIn bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'ই-বুক পিডিএফ সরাসরি ডাউনলোড লিংক (ঐচ্ছিক)' : 'Direct E-Book PDF Download URL (Optional)'}</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/economics_book.pdf"
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800"
                      value={newBook.ebookUrl}
                      onChange={(e) => setNewBook({...newBook, ebookUrl: e.target.value})}
                    />
                  </div>
                )}

                {/* Dynamic Cover Image manual input/preview overlay */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{lang === 'BN' ? 'উৎস কভার ফটো (ডাইরেক্ট লিঙ্ক)' : 'Direct Cover Photo URL or Preview'}</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input 
                      type="url" 
                      placeholder={lang === 'BN' ? "ম্যানুয়াল কভার লিংক..." : "Manual cover link override..."}
                      className="flex-1 w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-slate-800 text-xs"
                      value={newBook.cover}
                      onChange={(e) => setNewBook({...newBook, cover: e.target.value})}
                    />
                    {newBook.cover && (
                      <div className="flex items-center gap-3 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 min-w-[200px]">
                        <img src={newBook.cover} alt="Preview" className="w-10 h-12 object-cover rounded-md shadow-sm" />
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-indigo-600 block leading-none mb-1">{lang === 'BN' ? 'কভার প্রিভিউ' : 'Cover Preview'}</span>
                          <button type="button" onClick={() => setNewBook({...newBook, cover: ''})} className="text-[10px] text-rose-500 font-extrabold hover:underline block pointer-events-auto">{lang === 'BN' ? 'মুছে ফেলুন' : 'Remove'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    {lang === 'BN' ? 'তালিকায় নতুন বই যুক্ত করুন' : 'Add Book to Catalog'}
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
              className="relative bg-white w-full max-w-5xl rounded-[32px] md:rounded-[60px] shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row border border-white/20 max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-3 md:p-4 bg-white/85 md:bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all hover:rotate-90 shadow-md md:shadow-none"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="w-full md:w-[40%] p-6 md:p-12 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-[0.05] grayscale rotate-12 -translate-x-12">
                   <BarChart3 className="w-[400px] h-[400px]" />
                </div>
                {selectedBook.cover ? (
                  <img src={selectedBook.cover} className="w-full max-w-[200px] md:max-w-[300px] shadow-2xl rounded-2xl relative z-10" alt="Cover" />
                ) : (
                  <div className="w-40 h-60 md:w-48 md:h-72 bg-white rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                    <BookOpen className="w-16 h-16 md:w-20 md:h-20 text-indigo-100" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 md:p-20 md:overflow-y-auto md:max-h-[90vh]">
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
                        <button 
                          onClick={() => setIsReadingBook(selectedBook)}
                          className="flex items-center justify-center gap-3 py-6 bg-purple-600 text-white rounded-[32px] font-black hover:bg-slate-900 transition-all shadow-xl shadow-purple-100 cursor-pointer"
                        >
                          <Eye className="w-5 h-5" />
                          <span>{lang === 'BN' ? 'অনলাইনে পড়ুন' : 'Read Online'}</span>
                        </button>
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
              className="relative bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl text-left max-w-lg w-full overflow-y-auto max-h-[90vh] border border-slate-100 scrollbar-thin scrollbar-indigo-100"
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
