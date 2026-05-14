import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, 
  Search, Filter, RefreshCw, Loader2,
  BookOpen, User as UserIcon, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { fetchIssuesFromSheet, SheetIssue } from '@/src/lib/googleSheets';

const initialIssues: SheetIssue[] = [
  { id: 'I-001', bookTitle: 'আমার বন্ধু রাশেদ', memberName: 'Tanvir Ahmed', issueDate: '10 May 2024', dueDate: '24 May 2024', status: 'Active' },
  { id: 'I-002', bookTitle: 'চাদের পাহাড়', memberName: 'Alif Khan', issueDate: '01 May 2024', dueDate: '15 May 2024', status: 'Returned' },
  { id: 'I-003', bookTitle: 'হিমু', memberName: 'Sabbir Hossain', issueDate: '20 April 2024', dueDate: '04 May 2024', status: 'Overdue' },
];

export default function AdminIssues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [issues, setIssues] = useState<SheetIssue[]>(initialIssues);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);

  const loadIssues = async () => {
    const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_ISSUES_URL || localStorage.getItem('sheet_issues');
    if (!sheetUrl) {
      setIssues(initialIssues);
      setIsUsingSheet(false);
      return;
    }

    try {
      setLoading(true);
      const fetched = await fetchIssuesFromSheet(sheetUrl);
      if (fetched.length > 0) {
        setIssues(fetched);
        setIsUsingSheet(true);
      }
    } catch (err) {
      console.error('Issues fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = issues.filter(i => 
    i.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই ইস্যু ও ফেরত</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {issues.length} টি তথ্য পাওয়া গেছে</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ শিট
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={loadIssues}
          disabled={loading}
          className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full md:w-96 mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="বই বা সদস্যের নাম খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">বই (Book)</th>
                <th className="px-8 py-5">সদস্য (Member)</th>
                <th className="px-8 py-5">ইস্যু তারিখ</th>
                <th className="px-8 py-5">ফেরত তারিখ</th>
                <th className="px-8 py-5 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      <span className="font-black text-slate-900 line-clamp-1">{issue.bookTitle}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Link 
                      to={`/admin/users?search=${encodeURIComponent(issue.memberName)}`}
                      className="flex items-center space-x-3 group/link hover:text-indigo-600 transition-colors"
                    >
                      <UserIcon className="w-5 h-5 text-slate-400 group-hover/link:text-indigo-400" />
                      <span className="font-bold text-slate-600 group-hover/link:text-indigo-600">{issue.memberName}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-indigo-400" />
                    </Link>
                  </td>
                  <td className="px-8 py-6 text-slate-500 font-bold">{issue.issueDate}</td>
                  <td className="px-8 py-6 text-slate-500 font-bold">{issue.dueDate}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      issue.status === 'Active' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      issue.status === 'Returned' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
