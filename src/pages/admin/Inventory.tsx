import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, 
  MoreVertical, Plus, Edit2, 
  Trash2, QrCode, ArrowUpRight,
  Bookmark, CheckCircle2, XCircle,
  ImageIcon, X, Loader2, AlertTriangle,
  RefreshCw, FileText, Download, Eye, LayoutGrid, List as ListIcon,
  Package, DollarSign, HardDrive, Inbox, Printer
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, SupabaseBook } from '@/src/lib/supabaseDatabase';
import { getCurrentAdminUser } from '@/src/lib/adminAuth';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '@/src/supabaseClient';
import { defaultEconBooks } from '@/src/lib/defaultEconBooks';
import BookDetailsModal from '@/src/components/admin/BookDetailsModal';

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
  const [tempUrl, setTempUrl] = useState(SUPABASE_URL);
  const [tempKey, setTempKey] = useState(SUPABASE_PUBLIC_KEY);

  const [selectedBookForDetails, setSelectedBookForDetails] = useState<SupabaseBook | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState<string>('all');
  const [categoryFilterInTable, setCategoryFilterInTable] = useState<string>('all');

  const parsePriceNumber = (priceVal: any): number => {
    if (!priceVal) return 0;
    const str = String(priceVal);
    const bngToEng: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    let normalized = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (bngToEng[char] !== undefined) {
        normalized += bngToEng[char];
      } else {
        normalized += char;
      }
    }
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatBengaliNumber = (num: number): string => {
    const engToBng: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return String(num).split('').map(char => engToBng[char] || char).join('');
  };

  const exportToExcel = () => {
    if (books.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো বই ক্যাটালগে নেই!');
      return;
    }
    
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    tableHtml += `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inventory Assets</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
    tableHtml += `<h2>MBSTU Econ Library - Inventory Stock Register Report</h2>`;
    tableHtml += `<p>Generated: ${new Date().toLocaleDateString('bn-BD')} | Total Records: ${books.length}</p>`;
    tableHtml += `<table border="1" style="border-collapse: collapse;">`;
    tableHtml += `<tr style="background-color: #4f46e5; color: white; font-weight: bold;">`;
    tableHtml += `<th>ক্রমিক নং</th><th>বুক আইডি (Book ID)</th><th>বইয়ের নাম (Title)</th><th>লেখক (Author)</th><th>ক্যাটাগরি (Category)</th><th>মূল্য (Price)</th><th>মজুদ (Stock)</th><th>ভৌত কপি (Physical Quantity)</th><th>ইস্যুকৃত (Issued)</th><th>ক্ষতিগ্রস্ত (Damaged)</th><th>হারানো (Lost)</th><th>শেলফ নম্বর (Shelf)</th><th>টাইপ (Type)</th>`;
    tableHtml += `</tr>`;
    
    books.forEach((book, idx) => {
      const total = book.totalCopies !== undefined ? book.totalCopies : book.stock;
      tableHtml += `<tr>`;
      tableHtml += `<td style="text-align: center;">${idx + 1}</td>`;
      tableHtml += `<td style="font-family: monospace;">${book.bookId || ''}</td>`;
      tableHtml += `<td><strong>${book.title || ''}</strong></td>`;
      tableHtml += `<td>${book.author || ''}</td>`;
      tableHtml += `<td>${book.category || ''}</td>`;
      tableHtml += `<td style="text-align: right;">${book.price || ''}</td>`;
      tableHtml += `<td style="text-align: center; font-weight: bold; color: #16a34a;">${book.stock || 1}</td>`;
      tableHtml += `<td style="text-align: center;">${total}</td>`;
      tableHtml += `<td style="text-align: center; color: #2563eb;">${book.issuedCopies || 0}</td>`;
      tableHtml += `<td style="text-align: center; color: #dc2626;">${book.damagedCopies || 0}</td>`;
      tableHtml += `<td style="text-align: center; color: #4b5563;">${book.lostCopies || 0}</td>`;
      tableHtml += `<td style="text-align: center;">${book.shelfNo || 'N/A'}</td>`;
      tableHtml += `<td style="text-align: center;">${book.isEBook ? 'E-Book (PDF)' : 'Physical'}</td>`;
      tableHtml += `</tr>`;
    });
    tableHtml += `</table></body></html>`;

    // Convert to Excel Blob
    const blob = new Blob(['\ufeff' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mbstu_econ_library_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewDetailsClick = (book: SupabaseBook) => {
    setSelectedBookForDetails(book);
    setIsDetailModalOpen(true);
  };
  
  // Dynamic Category state
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('econ_library_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      'সাধারণ',
      'উপন্যাস',
      'কবিতা',
      'ইসলামী বই',
      'প্রবন্ধ',
      'ই-বুক',
      'Microeconomics (ব্যষ্টিগত অর্থনীতি)',
      'Macroeconomics (সমষ্টিগত অর্থনীতি)',
      'Econometrics (ইকোনোমেট্রিক্স)',
      'Development Economics (উন্নয়ন অর্থনীতি)',
      'International Economics (আন্তর্জাতিক অর্থনীতি)',
      'Bangladesh Economy (বাংলাদেশ অর্থনীতি)',
      'Mathematical Economics (গাণিতিক অর্থনীতি)',
      'Public Finance (সরকারি অর্থব্যবস্থা)',
      'Environmental Economics (পরিবেশ অর্থনীতি)',
      'Financial Economics & Banking (অর্থনীতি ও ব্যাংকিং)'
    ];
  });

  const [importingBooks, setImportingBooks] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

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
    shelfNo: 'N/A',
    isbn: '',
    totalCopies: 1,
    issuedCopies: 0,
    reservedCopies: 0,
    lostCopies: 0,
    damagedCopies: 0
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      const [allBooks, allIssues] = await Promise.all([
        db.getBooks(),
        db.getIssues().catch(() => [])
      ]);
      setBooks(allBooks);
      setIssues(allIssues || []);
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
      shelfNo: book.shelfNo || 'N/A',
      isbn: book.isbn || '',
      totalCopies: book.totalCopies !== undefined ? book.totalCopies : book.stock,
      issuedCopies: book.issuedCopies || 0,
      reservedCopies: book.reservedCopies || 0,
      lostCopies: book.lostCopies || 0,
      damagedCopies: book.damagedCopies || 0
    });
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    const admin = getCurrentAdminUser();
    if (admin.role !== 'super') {
      alert("You do not have permission for this action. Please contact the Super Admin.");
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে "${bookTitle}" ক্যাটালগ থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    setLoading(true);
    try {
      await db.deleteBook(bookId);
      try {
        await db.addAuditLog('DELETE_BOOK', `বই ক্যাটালগ থেকে চিরতরে ডিলিট করা হয়েছে: ${bookTitle}`);
      } catch (_) {}
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
        stock: newBook.stock || 1,
        price: newBook.price || '৳০',
        cover: newBook.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
        isEBook: newBook.isEBook,
        ebookUrl: newBook.isEBook ? newBook.ebookUrl : '',
        bookId: newBook.bookId || `ID-${Math.floor(Math.random() * 1000)}`,
        shelfNo: newBook.shelfNo || 'N/A',
        status: 'available',
        isbn: newBook.isbn || '',
        totalCopies: newBook.totalCopies !== undefined ? Number(newBook.totalCopies) : Number(newBook.stock),
        issuedCopies: newBook.issuedCopies || 0,
        reservedCopies: newBook.reservedCopies || 0,
        lostCopies: newBook.lostCopies || 0,
        damagedCopies: newBook.damagedCopies || 0
      };

      if (editingBookId) {
        bookData.id = editingBookId;
        await db.saveBook(bookData);
        try {
          await db.addAuditLog('EDIT_BOOK', `বইয়ের বিবরণ সম্পাদনা করা হয়েছে: ${bookData.title}`);
        } catch (_) {}
        alert('বইটি ক্যাটালগে সফলভাবে আপডেট করা হয়েছে!');
      } else {
        await db.saveBook(bookData);
        try {
          await db.addAuditLog('ADD_BOOK', `নতুন বই ক্যাটালগে যুক্ত করা হয়েছে: ${bookData.title}`);
        } catch (_) {}
        alert('বইটি ক্যাটালগে সফলভাবে যুক্ত করা হয়েছে!');
      }

      setIsModalOpen(false);
      setEditingBookId(null);
      setNewBook({
        title: '', author: '', category: 'সাধারণ', stock: 1, price: '',
        cover: '', isEBook: false, ebookUrl: '', bookId: '', shelfNo: 'N/A',
        isbn: '', totalCopies: 1, issuedCopies: 0, reservedCopies: 0, lostCopies: 0, damagedCopies: 0
      });
      loadBooks();
    } catch (err: any) {
      console.error('Save book error:', err);
      alert('বইটি সংরক্ষণ করতে সমস্যা হয়েছে:\n' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (books.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো বই ক্যাটালগে নেই!');
      return;
    }
    const headers = ['Book ID', 'Title', 'Author', 'Category', 'Price', 'Stock', 'EBook', 'EBook URL', 'Shelf No', 'Status'];
    const rows = books.map(book => [
      book.bookId || '',
      book.title || '',
      book.author || '',
      book.category || '',
      book.price || '',
      book.stock || 1,
      book.isEBook ? 'Yes' : 'No',
      book.ebookUrl || '',
      book.shelfNo || 'N/A',
      book.status || 'available'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(value => {
          const stringVal = String(value).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',')
      )
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `book_catalog_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.bookId && book.bookId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilterInTable === 'all' || 
        book.category === categoryFilterInTable;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, categoryFilterInTable]);

  // Overall statistics and category-wise statistics compiling
  const stats = useMemo(() => {
    let totalTitles = books.length;
    let totalPhysical = 0;
    let totalAvailable = 0;
    let totalIssued = 0;
    let totalReserved = 0;
    let totalLost = 0;
    let totalDamaged = 0;
    let totalEbooks = books.filter(b => b.isEBook).length;
    let totalFinishedIssue = issues.filter(i => i.status === 'Returned').length;

    books.forEach(b => {
      const t = b.totalCopies !== undefined ? Number(b.totalCopies) : (b.stock !== undefined ? Number(b.stock) : 1);
      const i = b.issuedCopies !== undefined ? Number(b.issuedCopies) : 0;
      const r = b.reservedCopies !== undefined ? Number(b.reservedCopies) : 0;
      const l = b.lostCopies !== undefined ? Number(b.lostCopies) : 0;
      const d = b.damagedCopies !== undefined ? Number(b.damagedCopies) : 0;
      const a = Math.max(0, t - i - r - l - d);

      totalPhysical += t;
      totalAvailable += a;
      totalIssued += i;
      totalReserved += r;
      totalLost += l;
      totalDamaged += d;
    });

    return {
      totalTitles,
      totalPhysical,
      totalAvailable,
      totalIssued,
      totalReserved,
      totalLost,
      totalDamaged,
      totalEbooks,
      totalFinishedIssue
    };
  }, [books, issues]);

  const categoryStats = useMemo(() => {
    const statsMap: Record<string, {
      category: string;
      titlesCount: number;
      totalPhysical: number;
      available: number;
      issued: number;
      reserved: number;
      lost: number;
      damaged: number;
      ebooksCount: number;
    }> = {};

    // Get all unique categories
    const allKnownCats = Array.from(new Set([...categories, ...books.map(b => b.category || 'সাধারণ')]));

    allKnownCats.forEach(cat => {
      statsMap[cat] = {
        category: cat,
        titlesCount: 0,
        totalPhysical: 0,
        available: 0,
        issued: 0,
        reserved: 0,
        lost: 0,
        damaged: 0,
        ebooksCount: 0
      };
    });

    books.forEach(b => {
      const cat = b.category || 'সাধারণ';
      if (!statsMap[cat]) {
        statsMap[cat] = {
          category: cat,
          titlesCount: 0,
          totalPhysical: 0,
          available: 0,
          issued: 0,
          reserved: 0,
          lost: 0,
          damaged: 0,
          ebooksCount: 0
        };
      }
      
      const t = b.totalCopies !== undefined ? Number(b.totalCopies) : (b.stock !== undefined ? Number(b.stock) : 1);
      const i = b.issuedCopies !== undefined ? Number(b.issuedCopies) : 0;
      const r = b.reservedCopies !== undefined ? Number(b.reservedCopies) : 0;
      const l = b.lostCopies !== undefined ? Number(b.lostCopies) : 0;
      const d = b.damagedCopies !== undefined ? Number(b.damagedCopies) : 0;
      const a = Math.max(0, t - i - r - l - d);

      statsMap[cat].titlesCount += 1;
      statsMap[cat].totalPhysical += t;
      statsMap[cat].available += a;
      statsMap[cat].issued += i;
      statsMap[cat].reserved += r;
      statsMap[cat].lost += l;
      statsMap[cat].damaged += d;
      if (b.isEBook) {
        statsMap[cat].ebooksCount += 1;
      }
    });

    return Object.values(statsMap);
  }, [books, categories]);

  // Selected Dashboard Category statistics
  const selectedCatData = useMemo(() => {
    if (selectedDashboardCategory === 'all') {
      return {
        category: 'সব ক্যাটাগরি',
        titlesCount: stats.totalTitles,
        totalPhysical: stats.totalPhysical,
        available: stats.totalAvailable,
        issued: stats.totalIssued,
        reserved: stats.totalReserved,
        lost: stats.totalLost,
        damaged: stats.totalDamaged,
        ebooksCount: stats.totalEbooks
      };
    }
    const found = categoryStats.find(cs => cs.category === selectedDashboardCategory);
    return found || {
      category: selectedDashboardCategory,
      titlesCount: 0,
      totalPhysical: 0,
      available: 0,
      issued: 0,
      reserved: 0,
      lost: 0,
      damaged: 0,
      ebooksCount: 0
    };
  }, [selectedDashboardCategory, stats, categoryStats]);

  const parsedStats = useMemo(() => {
    let totalAssetValue = 0;
    books.forEach(b => {
      const price = parsePriceNumber(b.price);
      const qty = b.totalCopies !== undefined ? Number(b.totalCopies) : (b.stock !== undefined ? Number(b.stock) : 1);
      totalAssetValue += price * qty;
    });

    const circulationRate = stats.totalPhysical > 0 
      ? Math.round((stats.totalIssued / stats.totalPhysical) * 100) 
      : 0;

    return {
      totalAssetValue,
      circulationRate
    };
  }, [books, stats]);

  // Chart 1: Category Distribution of physical copies Vs available copies
  const categoryChartData = useMemo(() => {
    return categoryStats
      .filter(item => item.totalPhysical > 0)
      .map(item => ({
        name: item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category,
        fullName: item.category,
        'মোট কপি': item.totalPhysical,
        'অবশিষ্ট উপলব্ধ': item.available,
        'ইস্যুকৃত কপি': item.issued
      }))
      .slice(0, 8); // Limits to top 8 active categories to keep it neat
  }, [categoryStats]);

  // Chart 2: Inventory Status Composition
  const compositionChartData = useMemo(() => {
    return [
      { name: 'অবশিষ্ট উপলব্ধ', value: stats.totalAvailable, color: '#10b981' }, 
      { name: 'ইস্যুকৃত কপি', value: stats.totalIssued, color: '#3b82f6' }, 
      { name: 'সংরক্ষিত পেন্ডিং', value: stats.totalReserved, color: '#f59e0b' }, 
      { name: 'মেরামতাধীন ড্যামেজ', value: stats.totalDamaged, color: '#f43f5e' }, 
      { name: 'হারানো কপি', value: stats.totalLost, color: '#64748b' }
    ].filter(item => item.value > 0);
  }, [stats]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12 text-left print:p-0 print:m-0">
      {/* Top Banner & Stat Cards */}
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 md:p-10 rounded-[45px] shadow-sm border border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3">
              <Package className="w-3.5 h-3.5" />
              <span>বিশ্ববিদ্যালয় ভৌত ট্র্যাকিং</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">লাইব্রেরি ইনভেন্টরি কন্ট্রোল</h2>
            <p className="text-slate-400 font-bold text-xs mt-1">ভৌত বইয়ের কপি, ধারদান, হারানো এবং মেরামত ট্র্যাকিং রিয়েল-টাইমে নিয়ন্ত্রণ করুন</p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-150 hover:bg-slate-900 transition-all cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>নতুন বই যোগ করুন</span>
            </button>
            <button 
              type="button"
              onClick={handlePrint}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all cursor-pointer font-sans"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>প্রিন্ট রিপোর্ট</span>
            </button>
            <button 
              type="button"
              onClick={loadBooks}
              className="px-5 py-4 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer font-sans border"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>সিঙ্ক করুন</span>
            </button>
          </div>
        </div>

        {/* Dynamic Multi-Column Bento Stat Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-11 gap-3">
          {[
            { label: 'মোট বই টাইটেল', count: stats.totalTitles, sub: 'শিরোনাম সংখ্যা', color: 'bg-indigo-50/60 text-indigo-700 border-indigo-100' },
            { label: 'মোট ভৌত কপি', count: stats.totalPhysical, sub: 'লাইব্রেরি সাইজ', color: 'bg-slate-100/60 text-slate-800 border-slate-205' },
            { label: 'অবশিষ্ট মজুদ', count: stats.totalAvailable, sub: 'আজকের উপলব্ধ', color: 'bg-emerald-50/60 text-emerald-700 border-emerald-150' },
            { label: 'ইস্যুকৃত কপি', count: stats.totalIssued, sub: 'সদস্যদের হাতে', color: 'bg-blue-50/60 text-blue-700 border-blue-150' },
            { label: 'সংরক্ষিত পেন্ডিং', count: stats.totalReserved, sub: 'পেন্ডিং রিকোয়েস্ট', color: 'bg-amber-50/60 text-amber-700 border-amber-150' },
            { label: 'হারানো কপি', count: stats.totalLost, sub: 'রিভিউ প্রয়োজন', color: 'bg-orange-50/60 text-orange-700 border-orange-150' },
            { label: 'ড্যামেজড কপি', count: stats.totalDamaged, sub: 'মেরামত চলছে', color: 'bg-rose-50/60 text-rose-700 border-rose-150' },
            { label: 'ই-বুক (PDF)', count: stats.totalEbooks, sub: 'পড়ুন অনলাইনে', color: 'bg-purple-50/60 text-purple-700 border-purple-150' },
            { label: 'পঠিত/ফেরত বই', count: stats.totalFinishedIssue, sub: 'সম্পন্ন ট্রানজেকশন', color: 'bg-teal-50/60 text-teal-700 border-teal-150' },
            { label: 'লাইব্রেরি সম্পদ মূল্য', count: '৳' + formatBengaliNumber(parsedStats.totalAssetValue), sub: 'ক্যাপিটাল এসেট', color: 'bg-yellow-50/60 text-amber-900 border-yellow-200' },
            { label: 'সার্কুলেশন রেট', count: formatBengaliNumber(parsedStats.circulationRate) + '%', sub: 'বই ব্যবহার হার', color: 'bg-cyan-50/60 text-cyan-800 border-cyan-155' }
          ].map((stat, sIdx) => {
            const countStr = typeof stat.count === 'number' ? formatBengaliNumber(stat.count) : stat.count;
            return (
              <div key={sIdx} className={cn("p-3.5 rounded-[22px] border flex flex-col justify-between shadow-sm hover:shadow-md transition-all bg-white", stat.color)}>
                <span className="text-[9px] font-black uppercase tracking-wider opacity-80 mb-1.5">{stat.label}</span>
                <div className="my-1 text-lg font-bold font-sans tracking-tight">{countStr}</div>
                <span className="text-[8px] font-bold opacity-60 leading-none">{stat.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC CATEGORY-WISE INTERACTIVE DASHBOARD SECTION */}
      <div className="bg-white p-6 md:p-10 rounded-[45px] shadow-sm border border-slate-100 space-y-8 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
              ক্যাটাগরি ভিত্তিক ইনভেন্টরি ও ড্যাশবোর্ড বিশ্লেষণ
            </h3>
            <p className="text-slate-400 font-bold text-xs mt-1">ক্যাটাগরি ভিত্তিক ধার, পিডিএফ মজুদ এবং রিয়েল-টাইম হিসাব বিবরণী</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">বিশ্লেষণ ক্যাটাগরি:</span>
            <select
              value={selectedDashboardCategory}
              onChange={(e) => setSelectedDashboardCategory(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="all">সব ক্যাটাগরি একত্রিত (All)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Column 1: Detailed metrics for selected category */}
          <div className="xl:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[35px] p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/25">নির্বাচিত ক্যাটাগরি বিশ্লেষণ</span>
                <h4 className="text-2xl font-black mt-3 text-slate-100 truncate leading-tight">{selectedCatData.category}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-indigo-200 font-black uppercase tracking-wider block">বই টাইটেল সংখ্যা</span>
                  <span className="text-2xl font-mono font-black mt-1 block">{selectedCatData.titlesCount} টি</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-indigo-200 font-black uppercase tracking-wider block">মোট ভৌত কপি</span>
                  <span className="text-2xl font-mono font-black mt-1 block">{selectedCatData.totalPhysical} টি</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-emerald-300 font-black uppercase tracking-wider block">অবशिष्ट মজুদ</span>
                  <span className="text-2xl font-mono font-black mt-1 block text-emerald-400">{selectedCatData.available} টি</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-blue-300 font-black uppercase tracking-wider block">ইস্যুকৃত (Borrowed)</span>
                  <span className="text-2xl font-mono font-black mt-1 block text-blue-400">{selectedCatData.issued} টি</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-purple-300 font-black uppercase tracking-wider block">পিডিএফ সংস্করণ</span>
                  <span className="text-2xl font-mono font-black mt-1 block text-purple-400">{selectedCatData.ebooksCount} টি</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-amber-300 font-black uppercase tracking-wider block">পেন্ডিং / বুকড</span>
                  <span className="text-2xl font-mono font-black mt-1 block text-amber-400">{selectedCatData.reserved} টি</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilterInTable(selectedDashboardCategory);
                  const listSection = document.getElementById('books-catalog-list-section');
                  if (listSection) {
                    listSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex-1 bg-white hover:bg-indigo-50 text-indigo-950 py-3.5 px-4 rounded-xl text-xs font-black transition-all text-center select-none cursor-pointer shadow-sm"
              >
                নিচের তালিকায় দেখুন
              </button>
              {selectedDashboardCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDashboardCategory('all');
                  }}
                  className="bg-white/10 hover:bg-white/15 text-white py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  রিসেট
                </button>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Category summary ledger table */}
          <div className="xl:col-span-2 space-y-4">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">ক্যাটাগরি ভিত্তিক উপলব্ধ সংখ্যা ও ধার বিবরণী তালিকা (All Categories Summary)</h5>
            
            <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-4 font-black">ক্যাটাগরি নাম</th>
                    <th className="px-4 py-4 text-center font-black">টাইটেল</th>
                    <th className="px-4 py-4 text-center font-black">মোট কপি</th>
                    <th className="px-4 py-4 text-center font-black text-emerald-600">অবশিষ্ট উপলব্ধ</th>
                    <th className="px-4 py-4 text-center font-black text-blue-600">ধারদান (Issued)</th>
                    <th className="px-4 py-4 text-center font-black text-purple-600">পিডিএফ / ইবুক</th>
                    <th className="px-6 py-4 text-center font-black">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {categoryStats.map((item) => {
                    const isSelected = item.category === selectedDashboardCategory;
                    return (
                      <tr 
                        key={item.category} 
                        className={cn(
                          "hover:bg-slate-50/50 transition-colors cursor-pointer",
                          isSelected && "bg-indigo-50/40 font-black text-slate-900"
                        )}
                        onClick={() => setSelectedDashboardCategory(item.category)}
                      >
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full inline-block animate-pulse"></span>}
                          {item.category}
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-slate-600">{item.titlesCount} টি</td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-slate-600">{item.totalPhysical} টি</td>
                        <td className="px-4 py-4 text-center font-mono font-black text-emerald-600 bg-emerald-50/10">{item.available} টি</td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-blue-600">{item.issued} টি</td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-purple-500">{item.ebooksCount} টি</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDashboardCategory(item.category);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 hover:text-indigo-700 text-slate-700 px-2.5 py-1.5 rounded-lg font-black transition-all cursor-pointer"
                          >
                            বিশ্লেষণ করুন
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL ANALYTICS REPORT: CHARTS BLOCK */}
      {categoryChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* Chart 1: Academic Categories Stock Distribution */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between text-left">
            <div className="mb-6">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-wider">স্টক ও ক্যাটালগ বন্টন</span>
              <h4 className="text-lg font-black text-slate-800 mt-3 font-sans">প্রধান শিক্ষায়তনিক ক্যাটাগরি ও কপি বন্টন</h4>
              <p className="text-[11px] font-bold text-slate-400 mt-1">সবচেয়ে জনপ্রিয় ৮টি ক্যাটাগরি অনুযায়ী মোট ভৌত কপি এবং উপলব্ধ কপি তুলনা</p>
            </div>
            
            <div className="w-full h-82">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontFamily: 'sans-serif', fontSize: '11px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                  <Bar dataKey="মোট কপি" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="অবशिष्ट উপলব্ধ" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Inventory Status Heath Composition */}
          <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between text-left">
            <div className="mb-6">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-wider">ইনভেন্টরি স্বাস্থ্য সূচক</span>
              <h4 className="text-lg font-black text-slate-800 mt-3 font-sans">ভৌত সম্পদের অবস্থা অনুপাত</h4>
              <p className="text-[11px] font-bold text-slate-400 mt-1">ধারদান, অবশিষ্ট স্টক, ড্যামেজ ও হারানো কপির আনুপাতিক সমন্বয়</p>
            </div>

            <div className="w-full h-52 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compositionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">মোট কপি</span>
                <span className="text-xl font-bold text-slate-850 mt-1 font-mono">{formatBengaliNumber(stats.totalPhysical)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-150 mt-4">
              {compositionChartData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}: {formatBengaliNumber(item.value)} টি</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div id="books-catalog-list-section" className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-4 rounded-[40px] border border-white/20 shadow-sm sticky top-4 z-40 print:hidden text-left">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="বই, লেখক বা ক্যাটাগরি..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[30px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans text-xs text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selective Category Search filter */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-[24px] px-4 shadow-sm w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={categoryFilterInTable}
              onChange={(e) => setCategoryFilterInTable(e.target.value)}
              className="py-4 pr-8 text-xs font-black text-slate-700 bg-transparent focus:outline-none cursor-pointer outline-none font-sans"
            >
              <option value="all">সব ক্যাটাগরি (All Catalog)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
             >
               <ListIcon className="w-5 h-5" />
             </button>
          </div>
          
          <button 
            type="button"
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-[18px] text-xs font-black transition-all shadow-sm cursor-pointer"
            title="CSV ফরম্যাটে ক্যাটালগ এক্সপোর্ট করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট</span>
          </button>
          
          <button 
            type="button"
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-3.5 bg-emerald-50 border border-emerald-150 text-emerald-700 hover:bg-emerald-100 rounded-[18px] text-xs font-black transition-all shadow-sm cursor-pointer"
            title="Excel ফরম্যাটে ক্যাটালগ এক্সপোর্ট করুন"
          >
            <FileText className="w-4 h-4" />
            <span>EXCEL এক্সপোর্ট</span>
          </button>

          <button 
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-3.5 bg-slate-950 text-white hover:bg-indigo-700 rounded-[18px] text-xs font-black transition-all shadow-sm cursor-pointer"
            title="পূর্ণাঙ্গ প্রিন্ট এবং পিডিএফ রিপোর্ট প্রিপেয়ার করুন"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF রিপোর্ট</span>
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
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => handleViewDetailsClick(book)}>{book.title}</h3>
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
              <div className="overflow-x-auto">
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
                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate cursor-pointer" onClick={() => handleViewDetailsClick(book)}>{book.title}</p>
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
             </div>
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
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4 flex justify-between items-center">
                      <span>ক্যাটাগরি</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const catName = window.prompt('নতুন ক্যাটাগরির নাম লিখুন:');
                          if (catName && catName.trim()) {
                            const trimmed = catName.trim();
                            if (!categories.includes(trimmed)) {
                              const updated = [...categories, trimmed];
                              setCategories(updated);
                              localStorage.setItem('econ_library_categories', JSON.stringify(updated));
                              setNewBook(prev => ({...prev, category: trimmed}));
                              alert(`"${trimmed}" ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে!`);
                            } else {
                              alert('ক্যাটাগরি ইতিমধ্যেই তালিকায় রয়েছে!');
                            }
                          }
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors font-black underline uppercase tracking-wider"
                      >
                        + নতুন ক্যাটাগরি
                      </button>
                    </label>
                    <select 
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
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

      <BookDetailsModal 
        book={selectedBookForDetails} 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        onUpdate={() => {
          loadBooks();
          if (selectedBookForDetails) {
            db.getBooks().then(updatedCollection => {
              const matched = updatedCollection.find(b => b.id === selectedBookForDetails.id);
              if (matched) setSelectedBookForDetails(matched);
            });
          }
        }} 
      />

      {/* DETAILED PRINTABLE STOCK LEDGER / AUDIT STATEMENT */}
      <div className="hidden print:block font-sans text-black p-8 bg-white max-w-4xl mx-auto">
        {/* Header Block */}
        <div className="text-center pb-6 mb-8 border-b-4 border-slate-900 text-left">
          <h1 className="text-3xl font-black tracking-wide text-slate-900 uppercase">মওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়</h1>
          <h2 className="text-xl font-bold tracking-normal text-slate-800 mt-1">অর্থনীতি বিভাগীয় গ্রন্থাগার ও তথ্য কেন্দ্র (Economics Library & Information Center)</h2>
          <p className="text-sm font-black text-slate-600 mt-1">সন্তোষ, টাঙ্গাইল-১৯০২, বাংলাদেশ (Santosh, Tangail-1902, Bangladesh)</p>
          <div className="inline-block bg-slate-100 px-5 py-2 rounded-xl text-xs font-black uppercase text-slate-800 mt-4 border border-slate-300">
            গ্রন্থাগার ক্যাটালগ ও ইনভেন্টরি স্টক রেজিস্টার রিপোর্ট (Inventory & Stock Register Ledger Statement)
          </div>
        </div>

        {/* Metadata Details Row */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-xs border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
          <div className="text-left font-sans">
            <p className="font-bold text-slate-600"><span className="font-black text-slate-900">রিপোর্ট আইডি:</span> REG-INV-{Math.floor(100000 + Math.random() * 900000)}</p>
            <p className="font-bold text-slate-600 mt-1"><span className="font-black text-slate-900">প্রস্তুতকারী:</span> লাইব্রেরি সিস্টেম এডমিনিস্ট্রেটর (MBSTU Econ Library Admin)</p>
          </div>
          <div className="text-right font-sans">
            <p className="font-bold text-slate-600"><span className="font-black text-slate-900">প্রিন্ট সময়কাল:</span> {new Date().toLocaleDateString('bn-BD')} | {new Date().toLocaleTimeString('bn-BD')}</p>
            <p className="font-bold text-slate-600 mt-1"><span className="font-black text-slate-900">মোট বই রেকর্ড:</span> {formatBengaliNumber(books.length)} টি টাইটেল ({formatBengaliNumber(stats.totalPhysical)} টি ভৌত কপি)</p>
          </div>
        </div>

        {/* Section 1: Executive Statistics Summary Table */}
        <div className="mb-8">
          <h3 className="text-sm font-black uppercase tracking-wide border-b-2 border-slate-800 pb-2 mb-4 text-slate-900 text-left">১. সামগ্রিক ইনভেন্টরি স্টক ইন্ডিকেটর (1. Overall Inventory Indicators)</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-300">
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">মোট বই ক্যাটাগরি</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">মোট বই টাইটেল</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">মোট ভৌত কপি</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">লাইব্রেরিতে মজুদ</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">ধারদান (Issued)</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">মেরামতাধীন (Damaged)</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">হারানো বই সংখ্যা</th>
                <th className="px-4 py-2.5 text-center">মোট পিডিএফ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-center border-b border-slate-300">
                <td className="px-4 py-3 border-r border-slate-300">{formatBengaliNumber(categories.length)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300">{formatBengaliNumber(stats.totalTitles)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300">{formatBengaliNumber(stats.totalPhysical)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300 text-emerald-700">{formatBengaliNumber(stats.totalAvailable)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300 text-blue-700">{formatBengaliNumber(stats.totalIssued)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300 text-rose-700">{formatBengaliNumber(stats.totalDamaged)} টি</td>
                <td className="px-4 py-3 border-r border-slate-300 text-orange-600">{formatBengaliNumber(stats.totalLost)} টি</td>
                <td className="px-4 py-3 text-purple-700">{formatBengaliNumber(stats.totalEbooks)} টি</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500 italic mt-2 font-bold font-sans text-left">* দ্রষ্টব্য: অবশিষ্ট কলাম তথ্যসমূহ অনলাইন ডাটাবেস সিকিউরড সিঙ্কে ট্র্যাক করা হয়ে থাকে। আনুমানিক মোট সম্পদ মূল্যমান ৳{formatBengaliNumber(parsedStats.totalAssetValue)} টাকা।</p>
        </div>

        {/* Section 2: Category Ledger Summary Table */}
        <div className="mb-8 page-break-inside-avoid">
          <h3 className="text-sm font-black uppercase tracking-wide border-b-2 border-slate-800 pb-2 mb-4 text-slate-900 text-left">২. ক্যাটালগ ভিত্তিক স্টক বন্টন তালিকা (2. Category Stock Distribution)</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-300">
                <th className="px-4 py-2.5 border-r border-slate-300">ক্রম</th>
                <th className="px-4 py-2.5 border-r border-slate-300">ক্যাটাগরি নাম (Category Name)</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">বই টাইটেল</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">মোট ভৌত কপি</th>
                <th className="px-4 py-2.5 border-r border-slate-300 text-center">সহজলভ্য অবশিষ্টাংশ</th>
                <th className="px-4 py-2.5 text-center">বর্তমানে ইস‍্যুকৃত</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="px-4 py-2 border-r border-slate-200 font-bold text-center">{formatBengaliNumber(idx + 1)}</td>
                  <td className="px-4 py-2 border-r border-slate-200 font-bold text-left">{item.category}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center">{formatBengaliNumber(item.titlesCount)} টি</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center">{formatBengaliNumber(item.totalPhysical)} টি</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-emerald-700 font-serif font-black">{formatBengaliNumber(item.available)} টি</td>
                  <td className="px-4 py-2 text-center text-blue-700">{formatBengaliNumber(item.issued)} টি</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Full Books Catalog Status Table */}
        <div className="mb-10 page-break-before">
          <h3 className="text-sm font-black uppercase tracking-wide border-b-2 border-slate-800 pb-2 mb-4 text-slate-900 text-left">৩. বিভাগীয় লাইব্রেরি ও স্টক রেজিস্টার ট্র্যাকিং (3. Comprehensive Ledger Register)</h3>
          <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="px-2 py-2 border-r border-slate-300 text-center">আইডি</th>
                <th className="px-3 py-2 border-r border-slate-300">বইয়ের শিরোনাম ও লেখক</th>
                <th className="px-2 py-2 border-r border-slate-300 text-center">ক্যাটাগরি</th>
                <th className="px-2 py-2 border-r border-slate-300 text-center">অবস্থান</th>
                <th className="px-2 py-2 border-r border-slate-300 text-center">মূল্য</th>
                <th className="px-2 py-2 border-r border-slate-300 text-center">মোট কপি</th>
                <th className="px-2 py-2 border-r border-slate-300 text-center">ইস্যুকৃত</th>
                <th className="px-2 py-2 text-center">অবশিষ্ট মজুদ</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, bIdx) => {
                const total = book.totalCopies !== undefined ? book.totalCopies : book.stock;
                const available = Math.max(0, total - (book.issuedCopies || 0) - (book.reservedCopies || 0) - (book.lostCopies || 0) - (book.damagedCopies || 0));
                return (
                  <tr key={book.id} className="border-b border-slate-200">
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono font-bold">{book.bookId || 'N/A'}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-left">
                      <p className="font-bold text-slate-900 leading-tight">{book.title}</p>
                      <p className="text-[9px] text-slate-500 italic font-bold">{book.author}</p>
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center truncate max-w-[100px] font-bold text-left">{book.category}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono font-bold">{book.shelfNo || 'N/A'}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-right font-serif font-black">{book.price || 'N/A'}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold">{formatBengaliNumber(total)}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-indigo-800">{formatBengaliNumber(book.issuedCopies || 0)}</td>
                    <td className="px-2 py-1.5 text-center font-serif font-black text-emerald-800 bg-emerald-50/20">{formatBengaliNumber(available)} টি</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 gap-12 mt-16 pt-12 border-t border-dashed border-slate-300 page-break-inside-avoid">
          <div className="text-center">
            <div className="w-48 h-10 border-b border-slate-100 border-b-slate-500 mx-auto"></div>
            <p className="text-xs font-black text-slate-800 mt-2">গ্রন্থাগার ইনভেন্টরি অফিসার (সহাক্ষর ও সিল)</p>
            <p className="text-[10px] text-slate-500 font-bold">তারিখ: ............................</p>
          </div>
          <div className="text-center">
            <div className="w-48 h-10 border-b border-slate-100 border-b-slate-500 mx-auto"></div>
            <p className="text-xs font-black text-slate-800 mt-2">বিভাগীয় প্রধান / প্রধান ডিরেক্টর লাইব্রেরি</p>
            <p className="text-[10px] text-slate-500 font-bold">মওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়</p>
          </div>
        </div>

        {/* Print only footer */}
        <div className="mt-16 text-center text-[10px] font-bold text-slate-400 italic">
          এই ইনভেন্টরি অডিট অ্যাকাউন্ট স্টেটমেন্ট ও স্টক লেজার ক্যাটালগ রিপোর্টটি সরাসরি বিশ্ববিদ্যালয়ের লাইব্রেরী অটোমেশন গেটওয়ে থেকে প্রস্তুতকৃত ও সুরক্ষিত।
        </div>
      </div>
    </div>
  );
}
