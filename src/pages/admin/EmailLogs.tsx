import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, CheckCircle2, XCircle, Search, Trash2, RotateCcw, 
  ShieldAlert, Clock, UserMinus, RefreshCw, AlertTriangle, 
  ChevronRight, BadgeInfo, Terminal, Check, AlertCircle,
  Activity, Key, Globe, UserX, Eye, Info, Sparkles, Ban
} from 'lucide-react';
import { db, SupabaseEmailLog, SupabaseMember } from '@/src/lib/supabaseDatabase';
import { diagnoseSMTPError, aggregateSMTPLogs } from '@/src/lib/smtpDiagnostic';

export default function EmailLogs() {
  const [logs, setLogs] = useState<SupabaseEmailLog[]>([]);
  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [smtpChecking, setSmtpChecking] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);

  // Diagnostic states
  const [filterSmtpCategory, setFilterSmtpCategory] = useState<string>('all');
  const [selectedDiagnosticLog, setSelectedDiagnosticLog] = useState<SupabaseEmailLog | null>(null);

  // Retry states
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Deleting state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await db.getEmailLogs();
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    }

    try {
      const fetchedMembers = await db.getMembers();
      setMembers(fetchedMembers);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
    setLoading(false);
  };

  const handleTestSMTP = async () => {
    setSmtpChecking(true);
    setSmtpStatus(null);
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      setSmtpStatus({
        success: response.ok && data.success,
        info: data
      });
    } catch (err: any) {
      setSmtpStatus({
        success: false,
        info: { error: 'Network Connection Failed', details: err.message }
      });
    } finally {
      setSmtpChecking(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('আপনি কি এই ইমেইল রেকর্ডটি ডিলিট করতে চান?')) return;
    try {
      await db.deleteEmailLog(id);
      setLogs(logs.filter(l => l.id !== id));
    } catch (err) {
      alert('রেকর্ড ডিলিট করা সম্ভব হয়নি।');
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('⚠️ গুরুত্বপূর্ণ সতর্কবার্তা!\n\nআপনি কি নিশ্চিতভাবেই সমস্ত জিমেইল হিস্ট্রি রেকর্ড মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
    try {
      setLoading(true);
      await db.clearEmailLogs();
      setLogs([]);
      alert('সমস্ত ইমেইল রেকর্ড ডিলিট করা সম্পন্ন হয়েছে।');
    } catch (err) {
      alert('ইতিহাস খালি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryEmail = async (log: SupabaseEmailLog) => {
    setRetryingLogId(log.id);
    try {
      // Formulate a simple html retry body or forward the exact HTML
      const alertSubject = `[RETRY] ${log.subject}`;
      const res = await db.sendEmailWithLog({
        to: log.recipient,
        subject: log.subject,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color:#4f46e5; margin-top:0;">পুনঃপ্রেরিত নোটিফিকেশন (Resent Notification)</h3>
          <p>প্রিয় গ্রাহক,</p>
          <p>কারিগরি বা সংযোগ সমস্যার কারণে আগের ইমেইলটি সফলভাবে ডেলিভারি করা সম্ভব হয়নি। পুনশ্চ আপনার জন্য পূর্ববর্তী মেইলটি রি-সেন্ড করা হলো।</p>
          <hr style="border:none; border-top:1px solid #f1f5f9; margin: 15px 0;">
          <div style="background-color:#f8fafc; padding:15px; border-radius:6px; color:#334155;">
            ${log.subject.includes('রশিদ') || log.subject.includes('ইস্যু') ? '<strong>Original Content Preview:</strong><br/>' : ''}
            ${log.subject}
          </div>
        </div>`,
        type: log.type || 'RETRY_ATTEMPT'
      });

      if (res.success) {
        alert(`সাফল্যের সাথে ইমেইলটি (${log.recipient}) এর কাছে পুনঃপ্রেরণ করা হয়েছে!\nMessage-ID: ${res.messageId}`);
        loadData();
      } else {
        alert(`পুনঃপ্রেরণ ব্যর্থ হয়েছে।\nসমস্যা: ${res.error}`);
      }
    } catch (err: any) {
      alert(`সার্ভার সংযোগে ত্রুটি কোড: ${err.message}`);
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleDeleteFakeUser = async (email: string) => {
    const matchedUser = members.find(m => m.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!matchedUser) {
      alert('এই ইমেইল ঠিকানার বিপরীতে কোনো সচল লাইব্রেরি মেম্বার খুঁজে পাওয়া যায়নি।');
      return;
    }

    const confirmMsg = `⚠️ চূড়ান্ত সতর্কবার্তা!\n\nশিক্ষার্থী অ্যাকাউন্টটি মুছে ফেলুন:\n\nনাম: ${matchedUser.name}\nরোল/আইডি: ${matchedUser.phone}\nইমেইল: ${matchedUser.email}\nস্ট্যাটাস: ${matchedUser.status}\n\nআপনি কি নিশ্চিত যে এই অ্যাকাউন্টটি ভুয়া (Fake/Invalid Gmail) এবং আপনি এটি সম্পূর্ণ ডিলিট করতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingUserId(matchedUser.id);
    try {
      await db.deleteMember(matchedUser.id);
      
      // Save administrative audit actions
      try {
        await db.addAuditLog('DELETE_FAKE_MEMBER_BY_EMAIL_FAIL', `ভুয়া ইমেল মেম্বার ডিলিট সম্পন্ন: ${matchedUser.name} (${matchedUser.email})`);
      } catch (_) {}

      alert('ভুয়া ইমেল ভিত্তিক মেম্বার অ্যাকাউন্টটি সফলভাবে ডাটাবেজ থেকে মুছে দেওয়া হয়েছে।');
      loadData();
    } catch (err: any) {
      alert('মেম্বার ডিলিট করতে ত্রুটি হয়েছে: ' + err.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // Processing list filtering
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    
    let matchesSmtpCategory = true;
    if (filterSmtpCategory !== 'all') {
      if (log.status !== 'failed') {
        matchesSmtpCategory = false;
      } else {
        const diagnosis = diagnoseSMTPError(log.errorDetails);
        matchesSmtpCategory = diagnosis.category === filterSmtpCategory;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesSmtpCategory;
  });

  // Calculate high-level statistics for stats widget
  const totalEmails = logs.length;
  const successEmails = logs.filter(l => l.status === 'success').length;
  const failedEmails = logs.filter(l => l.status === 'failed').length;
  const successRate = totalEmails > 0 ? Math.round((successEmails / totalEmails) * 100) : 100;
  const smtpDiagnostics = aggregateSMTPLogs(logs);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">জিমেইল আদান-প্রদান ইতিহাস (Gmail Delivery History Logs)</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            সিস্টেমের সমস্ত ইমেইল কনফার্মেশন, আইডি কার্ড সরবরাহ, মেয়াদ উত্তীর্ণ সতর্কবার্তা ও বুক রিটার্ন রশিদ প্রেরণের বিবরণ।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-95"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </button>
          {logs.length > 0 && (
            <button 
              onClick={handleClearAllLogs}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/40 transition-all active:scale-95"
              disabled={loading}
            >
              <Trash2 className="w-3.5 h-3.5" />
              ইতিহাস মুছুন
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black">মোট প্রেরিত ইমেইল</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalEmails}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black">সফল ডেলিভারি (Success)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{successEmails}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black">ব্যর্থ প্রচেষ্টা (Failed)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{failedEmails}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black">সফলতার হার (Success rate)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* Main Panel splitting Logs Table and Live SMTP configuration diagnoser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Table Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 bg-slate-50/55 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ইমেইল বা বিষয়ের নাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 sm:flex-none text-xs bg-white border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="success">সফল (Success)</option>
                  <option value="failed">ব্যর্থ (Failed)</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 sm:flex-none text-xs bg-white border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold"
                >
                  <option value="all">সব টাইপ নোটিফিকেশন</option>
                  <option value="WELCOME">স্বাগতম ইমেইল (WELCOME)</option>
                  <option value="RENEWAL_APPROVAL">মেম্বারশীপ নবায়ন (RENEWAL)</option>
                  <option value="REISSUE_CARD">কার্ড রি-ইস্যু (REISSUE)</option>
                  <option value="EXPIRY_REMINDER">মেম্বার সাবস্ক্রিপশন শেষ</option>
                  <option value="DUE_REMINDER">বকেয়া সতর্কবার্তা</option>
                  <option value="EVENT_INVITATION">ইভেন্ট আমন্ত্রণ</option>
                  <option value="BOOK_ISSUE">বই ইস্যু রশিদ</option>
                  <option value="BOOK_RETURN">বই রিটার্ন রশিদ</option>
                  <option value="FINE_PAYMENT">জরিমানা রশিদ</option>
                  <option value="REDUCE_FINE">জরিমানা মওকুফ</option>
                </select>

                <select
                  value={filterSmtpCategory}
                  onChange={(e) => setFilterSmtpCategory(e.target.value)}
                  className="flex-1 sm:flex-none text-xs bg-white border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-rose-600 bg-rose-50/50 border-rose-200"
                >
                  <option value="all">সব ব্যর্থতার প্রকার (All SMTP Errors)</option>
                  <option value="AUTH_ERROR">🔑 ক্রেডেনশিয়াল / অথেনটিকেশন</option>
                  <option value="RATE_LIMIT">⏳ লিমিট ব্লক / ওভারক্যাপ</option>
                  <option value="INVALID_RECIPIENT">📬 অকার্যকর / ভুয়া গ্রাহক</option>
                  <option value="CONNECTION">🌐 সার্ভার সংযোগ / নেটওয়ার্ক</option>
                  <option value="UNKNOWN">❓ অন্যান্য অনির্ধারিত</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium whitespace-pre-wrap">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  কোনো ইমেইল রেকর্ড খুঁজে পাওয়া যায়নি।
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">গ্রাহক (Recipient)</th>
                      <th className="p-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">বিষয় (Subject) / প্রকার</th>
                      <th className="p-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">ডেলিভারি অবস্থা (Status)</th>
                      <th className="p-4 text-[10px] text-slate-500 font-black uppercase tracking-wider text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => {
                      const logDate = new Date(log.timestamp);
                      const isUserRegisteredInSystem = members.some(m => m.email.toLowerCase().trim() === log.recipient.toLowerCase().trim());
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Recipient details */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 break-all select-all">{log.recipient}</span>
                              <span className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {logDate.toLocaleDateString('bn-BD')} {logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isUserRegisteredInSystem ? (
                                <span className="inline-flex self-start items-center gap-1 mt-1 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  নিবন্ধিত সদস্য (Registered member)
                                </span>
                              ) : (
                                <span className="inline-flex self-start items-center gap-1 mt-1 bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  অতিথি / অনিবন্ধিত
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Subject and Notification Type */}
                          <td className="p-4">
                            <div className="flex flex-col max-w-[200px] md:max-w-xs">
                              <span className="text-xs font-bold text-slate-800 line-clamp-1">{log.subject}</span>
                              <span className="text-[10px] text-indigo-600 font-black tracking-wide uppercase mt-1">
                                📁 {log.type || 'GENERAL'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                                Sender: {log.sender}
                              </span>
                            </div>
                          </td>

                          {/* Status and Diagnostics */}
                          <td className="p-4">
                            <div className="flex flex-col min-w-[150px]">
                              {log.status === 'success' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                  সফল (Success)
                                </span>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-black">
                                    <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                    ব্যর্থ (Failed)
                                  </span>

                                  {log.errorDetails && (() => {
                                    const diag = diagnoseSMTPError(log.errorDetails);
                                    let badgeColor = "bg-slate-50 text-slate-700 border-slate-200";
                                    let label = "ত্রুটি";

                                    if (diag.category === 'AUTH_ERROR') {
                                      badgeColor = "bg-rose-50 text-rose-700 border-rose-200/60";
                                      label = "🔑 ক্রেডেনশিয়াল / লগইন";
                                    } else if (diag.category === 'RATE_LIMIT') {
                                      badgeColor = "bg-amber-50 text-amber-700 border-amber-200/60";
                                      label = "⏳ লিমিট ব্লক / বেশি মেইল";
                                    } else if (diag.category === 'INVALID_RECIPIENT') {
                                      badgeColor = "bg-rose-50 text-rose-700 border-rose-200/50";
                                      label = "📬 অকার্যকর / ভুয়া ঠিকানা";
                                    } else if (diag.category === 'CONNECTION') {
                                      badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/60";
                                      label = "🌐 সার্ভার কানেকশন ত্রুটি";
                                    }

                                    return (
                                      <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center justify-center text-[9px] font-black tracking-wide leading-none py-1 px-1.5 rounded border ${badgeColor} self-start`}>
                                          {label}
                                        </span>
                                        <button 
                                          onClick={() => setSelectedDiagnosticLog(log)}
                                          className="flex items-center justify-center gap-1 w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-all text-[9.5px] font-bold rounded-lg border border-indigo-200 shadow-sm"
                                        >
                                          <Search className="w-2.5 h-2.5" />
                                          ডায়াগনস্টিকস করুন 🔍
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Action Items */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Retry Mail Attempt */}
                              {log.status === 'failed' && (
                                <button
                                  onClick={() => handleRetryEmail(log)}
                                  disabled={retryingLogId === log.id}
                                  title="পুনরায় পাঠান (Resend / Retry)"
                                  className="w-7 h-7 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center transition-all active:scale-90 border border-orange-200/50 disabled:slate-100 disabled:text-slate-400"
                                >
                                  <RotateCcw className={`w-3.5 h-3.5 ${retryingLogId === log.id ? 'animate-spin' : ''}`} />
                                </button>
                              )}

                              {/* Delete Fake user if mail fails as fake */}
                              {isUserRegisteredInSystem && (
                                <button
                                  onClick={() => handleDeleteFakeUser(log.recipient)}
                                  disabled={deletingUserId !== null}
                                  title="ভুয়া অ্যাকাউন্ট ডিলিট করুন (Delete Fake Member)"
                                  className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all active:scale-90 border border-red-200/40"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Individual Log Record */}
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                title="রেকর্ড ক্লিয়ার"
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center transition-all active:scale-90"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Panel Sidebar */}
        <div className="space-y-6">
          {/* SMTP Configuration Diagnostic Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Terminal className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">SMTP লাইভ কানেকশন ডায়াগনোসিস</h2>
            </div>
            <p className="text-xs text-slate-500 leading-normal font-medium">
              আপনার জিমেইল অ্যাকাউন্ট কানেকশন বা পাসওয়ার্ডে কোনো ত্রুটি থাকলে তা লাইভ পরীক্ষা করে দেখতে পারেন। এটি সরাসরি আপনার ইমেইলের পোর্ট ও কানেকশন টিজার চেক করে ফলাফল দেখাবে।
            </p>
            
            <button
              onClick={handleTestSMTP}
              disabled={smtpChecking}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${smtpChecking ? 'animate-spin' : ''}`} />
              {smtpChecking ? 'কানেকশন চেক হচ্ছে...' : 'SMTP কানেকশন টেস্ট করুন'}
            </button>

            {smtpStatus && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                smtpStatus.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {smtpStatus.success ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      কানেকশন সক্রিয় ও সচল! (SMTP Online)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      কানেকশন ত্রুটি! (SMTP Offline)
                    </>
                  )}
                </div>
                <div className="font-mono text-[10px] break-words whitespace-pre-wrap leading-normal bg-white/50 p-2 rounded-lg border border-black/5">
                  {JSON.stringify(smtpStatus.info, null, 2)}
                </div>
                {!smtpStatus.success && (
                  <div className="text-[10px] text-rose-700/90 font-medium">
                    🔍 <strong>পরামর্শ:</strong> জিমেইল ড্যাশবোর্ডে গিয়ে 2-Step Verification চেক করে <strong>একটি সচল App Password তৈরি করুন</strong> এবং .env ফাইলে GMAIL_APP_PASSWORD হিসেবে যুক্ত করুন।
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fake Email Checker instruction widget */}
          <div className="bg-amber-50/65 p-6 rounded-2xl border border-amber-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ভুয়া মেম্বার অ্যাকাউন্ট ডিটেকশন গাইড
            </div>
            <p className="text-[11px] text-amber-900/80 leading-normal font-medium">
              শিক্ষার্থীরা কখনো কখনো তাদের ভুল, ভুয়া বা টাইপো-যুক্ত ইমেইল এড্রেস দিয়ে সাইন আপ করে থাকে। মেইল পাঠানোর সময় SMTP সিস্টেম মেইল ডেলিভারি ব্যর্থ হলে এই লগ ইতিহাসে তা <strong>"వ్యర్థ (Failed)"</strong> স্ট্যাটাস দিবে এবং ইরর দেখাবে।
            </p>
            <ul className="text-[10px] text-amber-900/75 space-y-1.5 list-disc pl-4 font-medium">
              <li>লগটি ব্যর্থ দেখানোর কারণগুলো লক্ষ্য করুন।</li>
              <li>যদি <code className="bg-amber-100 px-1 py-0.5 rounded">"Recipient address rejected: Access denied"</code> বা <code className="bg-amber-100 px-1 py-0.5 rounded">"Not Found"</code> আসে, তাহলে শিক্ষার্থী ভুল বা ভুয়া ইমেইল দিয়েছে।</li>
              <li>ভুয়া শিক্ষার্থীদের সরাসরি ডাটাবেজ থেকে মুছে দিতে ইমেইল লগের ডানপাশের লাল <code className="bg-amber-100 px-1 py-0.5 rounded"><UserMinus className="w-3 h-3 inline pb-0.5" /> সদস্য মুছুন</code> বোতামে ক্লিক করুন।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SMTP Diagnostic Detail Interactive Overlay Modal */}
      <AnimatePresence>
        {selectedDiagnosticLog && (() => {
          const diag = diagnoseSMTPError(selectedDiagnosticLog.errorDetails);
          const isUserInSystem = members.some(m => m.email.toLowerCase().trim() === selectedDiagnosticLog.recipient.toLowerCase().trim());
          
          let alertIcon = <AlertCircle className="w-6 h-6 text-rose-500" />;
          let headerTheme = "bg-rose-50 border-rose-100 text-rose-900";
          if (diag.category === 'AUTH_ERROR') {
            alertIcon = <Key className="w-6 h-6 text-rose-500 animate-pulse" />;
          } else if (diag.category === 'RATE_LIMIT') {
            alertIcon = <Clock className="w-6 h-6 text-amber-500" />;
            headerTheme = "bg-amber-50 border-amber-100 text-amber-950";
          } else if (diag.category === 'INVALID_RECIPIENT') {
            alertIcon = <UserX className="w-6 h-6 text-rose-500" />;
          } else if (diag.category === 'CONNECTION') {
            alertIcon = <Globe className="w-6 h-6 text-indigo-500" />;
            headerTheme = "bg-indigo-50 border-indigo-100 text-indigo-950";
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDiagnosticLog(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className={`p-6 border-b flex items-start gap-4 ${headerTheme}`}>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-black/5">
                    {alertIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded-full">
                        {diag.severity} Severity
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Log-ID: #{selectedDiagnosticLog.id.slice(0, 8)}
                      </span>
                    </div>
                    <h2 className="text-base font-black mt-1 line-clamp-1">{diag.categoryLabelBn}</h2>
                    <p className="text-[11px] font-bold text-black/55 mt-0.5 break-all select-all">
                      গ্রাহক: {selectedDiagnosticLog.recipient}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedDiagnosticLog(null)}
                    className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh] text-left">
                  {/* Bangladesh-first explanation */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      সমস্যা বিশ্লেষণ ও সারসংক্ষেপ
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-700 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                      {diag.explanationBn}
                    </p>
                  </div>

                  {/* Raw NodeMailer Error Trace */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-slate-600" />
                        র জিমেইল লক বিবরণী (Raw SMTP Response)
                      </h3>
                      <button
                        onClick={() => {
                          if (selectedDiagnosticLog.errorDetails) {
                            navigator.clipboard.writeText(selectedDiagnosticLog.errorDetails);
                            alert('SMTP এরর মেসেজটি ক্লিপবোর্ডে কপি করা হয়েছে!');
                          }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/40 px-2 py-1 rounded"
                      >
                        কপি করুন (Copy Code)
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-200 text-[10.5px] font-mono leading-relaxed rounded-2xl border border-slate-800 break-words whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {selectedDiagnosticLog.errorDetails || 'কোনো র-এরর ডিটেইলস পাওয়া যায়নি।'}
                    </pre>
                  </div>

                  {/* Dynamic Causes Checklist */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      সম্ভাব্য কারণসমূহ (Possible Causes)
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {diag.possibleCausesBn.map((cause, idx) => (
                        <div key={idx} className="flex gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 text-xs font-medium text-slate-600">
                          <span className="text-rose-500 font-bold shrink-0">❌</span>
                          <span>{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Actions Steps Checklist */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      করণীয় ও সমাধান নির্দেশিকা (Suggested Solutions)
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {diag.recommendationsBn.map((rec, idx) => (
                        <div key={idx} className="flex gap-2.5 p-3.5 rounded-xl border border-emerald-100/60 bg-emerald-50/20 text-xs font-bold text-slate-700">
                          <span className="text-emerald-500 font-bold shrink-0">✔️</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>

                    {diag.category === 'AUTH_ERROR' && (
                      <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1 text-slate-700">
                        <p className="font-extrabold text-indigo-900">💡 অ্যাডমিন ইনফরমেশন নোট:</p>
                        <p className="font-medium text-[11px] leading-relaxed">
                          আপনি জিমেইলের যে নতুন ক্রেডেনশিয়াল <strong>{`eco24034@mbstu.ac.bd`}</strong> প্রদান করেছেন তা ইতিমধ্যে সিস্টেমের <code className="bg-indigo-100 px-1 py-0.5 rounded">.env</code> ফাইলে যুক্ত করা হয়েছে! অনুগ্রহ করে নিচের লাইভ কানেকশন বোতামের মাধ্যমে একবার সেটি পরীক্ষা করে নিন।
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {diag.category === 'INVALID_RECIPIENT' && isUserInSystem && (
                      <button
                        onClick={() => {
                          handleDeleteFakeUser(selectedDiagnosticLog.recipient);
                          setSelectedDiagnosticLog(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black active:scale-95 transition-all shadow-md shadow-rose-500/10"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        ভুয়া মেম্বার ডিলিট করুন (Delete Fake Member)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleRetryEmail(selectedDiagnosticLog)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-white rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      রি-সেন্ড করুন (Retry Send)
                    </button>
                    <button
                      onClick={() => setSelectedDiagnosticLog(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 font-bold text-white rounded-xl text-xs transition-all active:scale-95"
                    >
                      বন্ধ করুন (Close)
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
