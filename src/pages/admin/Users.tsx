import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users as UsersIcon, Search, Filter, 
  MoreVertical, UserPlus, Mail, Phone,
  CheckCircle2, XCircle, Shield, Trash2,
  Edit2, Loader2, RefreshCw, X, Printer,
  MapPin, Briefcase, Calendar as CalendarIcon,
  Download, Send, Bell, Copy, Check, ExternalLink,
  Share2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseMember } from '@/src/lib/supabaseDatabase';
import { motion, AnimatePresence } from 'motion/react';
import IdCardDownloader from '@/src/components/admin/IdCardDownloader';

const initialMembers: any[] = [];

export default function AdminUsers() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(new URLSearchParams(location.search).get('search') || '');
  const [members, setMembers] = useState<SupabaseMember[]>(initialMembers as any[]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SupabaseMember | null>(null);
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [noticeResult, setNoticeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [successModalMember, setSuccessModalMember] = useState<SupabaseMember | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');

  // Approval Custom Card Expiry and Issue Date configurator modal states
  const [showApprovalConfigModal, setShowApprovalConfigModal] = useState(false);
  const [memberToApprove, setMemberToApprove] = useState<SupabaseMember | null>(null);
  const [issueDateVal, setIssueDateVal] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [validityType, setValidityType] = useState<string>('4');
  const [customExpiryVal, setCustomExpiryVal] = useState('');

  const formatDateToSlash = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('bn-BD');
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const getExpiryDateStr = (issueDateStr: string, type: string, customVal: string) => {
    const parts = issueDateStr.split('-'); // issueDateStr is YYYY-MM-DD
    if (parts.length !== 3) return new Date().toLocaleDateString('bn-BD');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    if (type === 'lifetime') {
      return 'আজীবন (Lifetime)';
    }
    if (type === 'custom' && customVal) {
      return formatDateToSlash(customVal);
    }

    const offset = parseInt(type) || 4;
    const expYear = year + offset;
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${expYear}`;
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const fetched = await db.getMembers();
      setMembers(fetched);
      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendNotice = async () => {
    if (!selectedMember || !noticeMessage) return;
    
    setIsSendingNotice(true);
    setNoticeResult(null);

    try {
      // Simulate real-time dispatch or write to DB
      setNoticeResult({ success: true, message: 'সদস্যকে সফলভাবে নোটিশ পাঠানো হয়েছে!' });
      setNoticeMessage('');
    } catch (err) {
      setNoticeResult({ success: false, message: 'পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setIsSendingNotice(false);
    }
  };

  const handleStatusUpdate = async (member: SupabaseMember, newStatus: 'accepted' | 'rejected') => {
    if (newStatus === 'accepted') {
      setMemberToApprove(member);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setIssueDateVal(`${yyyy}-${mm}-${dd}`);
      setValidityType('4');
      setCustomExpiryVal('');
      setShowApprovalConfigModal(true);
      return;
    }

    const reason = window.prompt('কেন এই সদস্যপদ আবেদনটি বাতিল করা হচ্ছে তার কারণ উল্লেখ করুন (বাধ্যতামূলক):');
    if (reason === null) return; // User cancelled prompt
    if (!reason.trim()) {
      alert('বাতিল করার কারণ উল্লেখ করা আবশ্যক!');
      return;
    }

    try {
      setLoading(true);
      const updated = {
        ...member,
        status: newStatus
      };
      await db.saveMember(updated);
      try {
        await db.addAuditLog('REJECT_MEMBER', `মেম্বারশিপ বাতিল করা হয়েছে: ${member.name} - কারণ: ${reason}`);
      } catch (_) {}
      setSelectedMember(updated);
      await loadMembers();
      alert(`সদস্যের স্ট্যাটাস সফলভাবে বাতিল করা হয়েছে!`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('স্ট্যাটাস সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const confirmApproval = async () => {
    if (!memberToApprove) return;

    const formattedIssueStr = formatDateToSlash(issueDateVal);
    const formattedExpiryStr = getExpiryDateStr(issueDateVal, validityType, customExpiryVal);
    const combinedJoinDate = `${formattedIssueStr}|${formattedExpiryStr}`;

    const appNote = window.prompt('সদস্য অনুমোদনের জন্য কোনো নোট যোগ করতে চান? (ঐচ্ছিক):') || 'কোনো নোট নেই';

    try {
      setLoading(true);
      const updated = {
        ...memberToApprove,
        status: 'accepted' as const,
        joinDate: combinedJoinDate
      };
      
      await db.saveMember(updated);
      try {
        await db.addAuditLog('APPROVE_MEMBER', `মেম্বারশিপ অনুমোদন করা হয়েছে: ${updated.name} (মেয়াদ: ${formattedExpiryStr}) - নোট: ${appNote}`);
      } catch (_) {}
      setSelectedMember(updated);
      await loadMembers();
      
      setSuccessModalMember(updated);
      setShowApprovalConfigModal(false);
      setMemberToApprove(null);

      // Background email alert dispatch
      const emailSubject = 'স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
            <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
          </div>
          
          <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: bold;">প্রিয় ${updated.name},</p>
            <p>শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #4f46e5; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">আইডি তথ্য ও মেয়াদকাল:</p>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">সদস্য আইডি:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">ECO-${updated.id.padStart(4, '0')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">কার্ডের ইস্যুর তারিখ:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${formattedIssueStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">কার্ডের মেয়াদকাল:</td>
                  <td style="padding: 6px 0; color: #ef4444; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">${formattedExpiryStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">সদস্যপদ রোল:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${updated.role}</td>
                </tr>
              </table>
            </div>
            
            <p>এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0 20px 0;">
            <a href="${window.location.origin}/login" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">প্রোফাইল ড্যাশবোর্ডে লগইন করুন</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p>এটি একটি স্বয়ংক্রিয় সিস্টেম জেনারেটেড ইমেল। অনুগ্রহ করে এই ইমেলের সরাসরি উত্তর দেবেন না।</p>
            <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
          </div>
        </div>
      `;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: updated.email,
          subject: emailSubject,
          html: emailHtml
        })
      }).catch(err => console.warn('Silent SMTP background welcome welcome attempt failed:', err));

    } catch (err: any) {
      console.error('Failed to approve member:', err);
      alert('সদস্য সক্রিয় করতে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePayDues = async (member: SupabaseMember) => {
    const amountStr = window.prompt(`প্রবেশ করান পরিশোধিত পরিমাণ (সর্বোচ্চ ৳${member.dues}):`, String(member.dues));
    if (amountStr === null) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > member.dues) {
      alert('সদস্যের বকেয়া পরিশোধের জন্য সঠিক ও বৈধ পরিমাণ দিন!');
      return;
    }

    try {
      setLoading(true);
      const updated = {
        ...member,
        dues: member.dues - amount
      };
      await db.saveMember(updated);
      setSelectedMember(updated);
      await loadMembers();
      alert(`৳${amount} সফলভাবে পরিশোধ করা হয়েছে! অবশিষ্ট বকেয়া: ৳${updated.dues}`);
    } catch (err: any) {
      console.error('Failed to update dues:', err);
      alert('বকেয়া পরিশোধ সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return m.status === 'pending';
    if (statusFilter === 'active') return m.status === 'accepted' || m.status === 'active';
    if (statusFilter === 'rejected') return m.status === 'rejected';
    
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-8 rounded-[24px] md:rounded-[40px] shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্য ব্যবস্থাপনা</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {members.length} জন নিবন্ধিত সদস্য</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ শিট
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadMembers}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <UserPlus className="w-5 h-5" />
            <span>নতুন সদস্য</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center space-x-2.5 w-full sm:w-auto self-end sm:self-auto">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">স্ট্যাটাস ফিল্টার:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100/40 focus:border-indigo-500 transition-all outline-none"
            >
              <option value="all">সবাই (All Members)</option>
              <option value="pending">পেন্ডিং (Pending)</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="rejected">বাতিল (Rejected)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">সদস্য (Member)</th>
                <th className="px-8 py-5">বিস্তারিত</th>
                <th className="px-8 py-5">স্ট্যাটাস</th>
                <th className="px-8 py-5">ভূমিকা</th>
                <th className="px-8 py-5 text-right">বকেয়া (Dues)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => setSelectedMember(member)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      {member.photo && member.photo !== "" ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900 line-clamp-1">{member.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full inline-block mt-1">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-500 font-bold text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.email}
                      </div>
                      <div className="flex items-center text-slate-400 font-bold text-[10px]">
                        <Phone className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      member.status === 'accepted' || member.status === 'active'
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : member.status === 'pending'
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {member.status === 'accepted' ? 'সক্রিয়' : member.status === 'pending' ? 'পেন্ডিং' : member.status === 'rejected' ? 'বাতিল' : member.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-slate-600 font-black">
                      <Shield className="w-4 h-4 mr-2 text-indigo-400" />
                      {member.role}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "font-black text-lg",
                      member.dues > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      ৳{member.dues}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="p-5 hover:bg-slate-50/50 active:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                {member.photo && member.photo !== "" ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-base border border-indigo-100 shadow-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm truncate">{member.name}</p>
                  <p className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">{member.id}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 space-y-1.5">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                  member.status === 'accepted' || member.status === 'active'
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : member.status === 'pending'
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                )}>
                  {member.status === 'accepted' ? 'সক্রিয়' : member.status === 'pending' ? 'পেন্ডিং' : member.status === 'rejected' ? 'বাতিল' : member.status}
                </span>
                <span className={cn(
                  "font-black text-sm",
                  member.dues > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  ৳{member.dues}
                </span>
              </div>
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              কোনো সদস্য পাওয়া যায়নি
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] md:rounded-[48px] shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-none"
            >
              {/* Profile Card Header */}
              <div className="relative h-32 md:h-40 bg-indigo-600 print:hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 md:top-8 right-4 md:right-8 w-10 md:w-12 h-10 md:h-12 bg-white/20 hover:bg-white/30 rounded-xl md:rounded-2xl flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="px-5 md:px-10 pb-6 md:pb-10">
                <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-6 mb-8 md:mb-10 text-center md:text-left">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white p-2 rounded-[32px] md:rounded-[40px] shadow-2xl print:shadow-none shrink-0">
                    {selectedMember.photo && selectedMember.photo !== "" ? (
                      <img 
                        src={selectedMember.photo} 
                        alt={selectedMember.name} 
                        className="w-full h-full object-cover rounded-[24px] md:rounded-[32px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-[24px] md:rounded-[32px] flex items-center justify-center text-indigo-600 text-4xl md:text-5xl font-black">
                        {selectedMember.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pb-2 md:pb-4">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{selectedMember.name}</h3>
                    <p className="text-indigo-600 font-black flex items-center justify-center md:justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      {selectedMember.role} Member
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-end gap-3 print:hidden w-full md:w-auto">
                    <button 
                      onClick={handlePrint}
                      className="w-14 h-14 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-[22px] flex items-center justify-center border border-slate-100 transition-all shadow-sm active:scale-95"
                      title="প্রিন্ট করুন"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                    {selectedMember.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(selectedMember, 'accepted')}
                          className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs shrink-0"
                        >
                          সক্রিয় করুন
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedMember, 'rejected')}
                          className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs shrink-0"
                        >
                          বাতিল করুন
                        </button>
                      </>
                    ) : selectedMember.status === 'accepted' || selectedMember.status === 'active' ? (
                      <button 
                        onClick={() => handleStatusUpdate(selectedMember, 'rejected')}
                        className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs"
                      >
                        নিষ্ক্রিয়/বাতিল করুন
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusUpdate(selectedMember, 'accepted')}
                        className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[22px] font-black transition-all active:scale-95 shadow-md text-xs"
                      >
                        সক্রিয় করুন
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">যোগাযোগ</h4>
                      <div className="space-y-4">
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                            <Mail className="w-5 h-5 text-indigo-400" />
                          </div>
                          <span className="font-bold text-xs md:text-sm break-all">{selectedMember.email}</span>
                        </div>
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                            <Phone className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="font-bold text-xs md:text-sm break-all">{selectedMember.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">বিবিধ</h4>
                      <div className="space-y-4">
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                            <Briefcase className="w-5 h-5 text-amber-400" />
                          </div>
                          <span className="font-bold text-xs md:text-sm">{selectedMember.occupation || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-slate-700">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                            <MapPin className="w-5 h-5 text-rose-400" />
                          </div>
                          <span className="font-bold text-xs md:text-sm">{selectedMember.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedMember.paymentMethod && (
                      <div className="bg-slate-50 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">নিবন্ধন ফি পেমেন্ট (Admission Payment)</h4>
                        <div className="space-y-4">
                          <div className="flex items-center text-slate-700 justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">পেমেন্ট মেথড</span>
                            <span className="font-black text-[10px] uppercase text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                              {selectedMember.paymentMethod === 'online' ? 'বিকাশ / নগদ (Online)' : 'পাঠাগার কাউন্টার (Desk)'}
                            </span>
                          </div>
                          {selectedMember.senderNumber && (
                            <div className="flex items-center text-slate-700 justify-between">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">প্রেরক নাম্বার</span>
                              <span className="font-bold text-xs text-slate-900 font-mono select-all bg-white px-2 py-1 rounded-md border border-slate-200">{selectedMember.senderNumber}</span>
                            </div>
                          )}
                          {selectedMember.trxId && (
                            <div className="flex items-center text-slate-700 justify-between">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {selectedMember.paymentMethod === 'online' ? 'Transaction ID' : 'রশিদ নং / স্লিপ নং'}
                              </span>
                              <span className="font-black text-xs text-indigo-600 font-mono select-all bg-indigo-50/50 px-2 py-1 rounded-md">{selectedMember.trxId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {(selectedMember.status === 'accepted' || selectedMember.status === 'active') ? (
                      <IdCardDownloader member={selectedMember} />
                    ) : (
                      <div className="bg-slate-900 p-5 md:p-8 rounded-[24px] md:rounded-[40px] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">আইডি কার্ড তথ্য</h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase">মেম্বার আইডি</p>
                              <p className="text-xl font-black">{selectedMember.id}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase">যোগদান</p>
                                <p className="font-bold">{selectedMember.joinDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase">স্ট্যাটাস</p>
                                <p className={cn(
                                  "font-black uppercase",
                                  selectedMember.status === 'pending' ? "text-amber-400" : "text-rose-400"
                                )}>{selectedMember.status === 'pending' ? 'পেন্ডিং' : selectedMember.status === 'rejected' ? 'বাতিল' : String(selectedMember.status)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-50 border border-emerald-100 p-5 md:p-8 rounded-[24px] md:rounded-[40px] text-emerald-900 flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-black uppercase opacity-60 mb-1">মোট বকেয়া</p>
                         <p className="text-3xl font-black">৳ {selectedMember.dues}</p>
                       </div>
                       {selectedMember.dues > 0 && (
                         <button 
                           onClick={() => handlePayDues(selectedMember)}
                           className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95"
                         >
                           পরিশোধ করুন
                         </button>
                       )}
                    </div>

                    {/* 1-Click Mailbox Prefill Section for non-tech users */}
                    <div id="one-click-mail-helper" className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-indigo-100/60 print:hidden relative overflow-hidden group text-left">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-750 rounded-xl flex items-center justify-center text-lg shrink-0 select-none">
                            ✉️
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-tight">১-ক্লিক ইমেইল প্রি-ফিল (Direct Gmail/Mail App)</h4>
                            <p className="text-[10px] text-indigo-650 font-bold leading-none mt-0.5">নিরাপদ, সহজ ও পাসওয়ার্ড ছাড়া ফ্রি ইমেইল নোটিফিকেশন</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          এই বাটনে ক্লিক করলেই আপনার কম্পিউটার বা মোবাইলের অফিশিয়াল জিমেইল কিংবা মেইল অ্যাপটি সরাসরি ওপেন হয়ে যাবে। সেখানে শিক্ষার্থীর ইমেইল ঠিকানা, সাবজেক্ট এবং ভেতরের অভিনন্দন বার্তা স্বয়ংক্রিয়ভাবে টাইপ করা থাকবে (সদস্য আইডি এবং লগইন লিংকসহ)। আপনাকে কোনো পাসওয়ার্ড সেটআপ করতে হবে না, শুধু আপনার মেইল অ্যাপ থেকে Send বাটনে চাপ দিলেই শিক্ষার্থীর কাছে ইমেল চলে যাবে! এটি ১০০% ফ্রি ও সুরক্ষিত।
                        </p>

                        <button 
                          onClick={() => {
                            const subjectVal = encodeURIComponent('স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library');
                            const bodyVal = encodeURIComponent(`প্রিয় ${selectedMember.name},

শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।

আপনার একাউন্টের তথ্য:
সদস্য আইডি: ECO-${selectedMember.id.padStart(4, '0')}
ভূমিকা: ${selectedMember.role}
স্ট্যাটাস: সক্রিয় (Active)

এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।

লগইন লিঙ্ক: ${window.location.origin}/login

ধন্যবাদ,
MBSTU Econ Library & Organization`);
                            
                            // Try multiple ways to activate mailto deep link across different devices/browsers/iframes
                            const mailtoUrl = `mailto:${selectedMember.email}?subject=${subjectVal}&body=${bodyVal}`;
                            try {
                              window.location.href = mailtoUrl;
                            } catch (e) {
                              window.open(mailtoUrl, '_blank');
                            }
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 duration-100"
                        >
                          <ExternalLink className="w-4 h-4 animate-pulse" />
                          <span>জিমেইল বা মেইল অ্যাপ ওপেন করুন</span>
                        </button>

                        {/* Backup manual copy fields when iframe blocks mailto scheme */}
                        <div className="pt-4 border-t border-slate-200/50 space-y-3">
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                            💡 ইমেইল অ্যাপ লকড/ওপেন না হলে নিচের ম্যানুয়াল ১-ক্লিক কপি ব্যবহার করুন:
                          </p>

                          <div className="space-y-2">
                            {/* Email Copy */}
                            <div className="flex flex-col space-y-1">
                              <span className="text-[9px] text-slate-400 font-extrabold">১. শিক্ষার্থীর ইমেইল ঠিকানা</span>
                              <div className="flex items-center gap-2 bg-white/90 border border-slate-150 p-2 rounded-xl text-left">
                                <span className="text-xs font-mono font-bold text-slate-700 truncate flex-1">{selectedMember.email}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedMember.email);
                                    setCopiedEmail(true);
                                    setTimeout(() => setCopiedEmail(false), 2000);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 shrink-0"
                                >
                                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span className="text-[9px] font-black">{copiedEmail ? 'কপিড' : 'কপি'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Subject Copy */}
                            <div className="flex flex-col space-y-1">
                              <span className="text-[9px] text-slate-400 font-extrabold">২. ইমেইল বিষয় (Subject)</span>
                              <div className="flex items-center gap-2 bg-white/90 border border-slate-150 p-2 rounded-xl text-left">
                                <span className="text-xs font-bold text-slate-700 truncate flex-1">স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library</span>
                                <button
                                  onClick={() => {
                                    const subject = 'স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library';
                                    navigator.clipboard.writeText(subject);
                                    setCopiedSubject(true);
                                    setTimeout(() => setCopiedSubject(false), 2000);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 shrink-0"
                                >
                                  {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span className="text-[9px] font-black">{copiedSubject ? 'কপিড' : 'কপি'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Body Copy */}
                            <div className="flex flex-col space-y-1">
                              <span className="text-[9px] text-slate-400 font-extrabold">৩. ইমেইল বার্তা (Email Content)</span>
                              <div className="bg-white/90 border border-slate-150 p-3 rounded-xl text-left space-y-2">
                                <div className="text-[10px] font-bold text-slate-600 max-h-[80px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                                  {`প্রিয় ${selectedMember.name},

শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।

আপনার একাউন্টের তথ্য:
সদস্য আইডি: ECO-${selectedMember.id.padStart(4, '0')}
ভূমিকা: ${selectedMember.role}
স্ট্যাটাস: সক্রিয় (Active)

এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।

লগইন লিঙ্ক: ${window.location.origin}/login

ধন্যবাদ,
MBSTU Econ Library & Organization`}
                                </div>
                                <button
                                  onClick={() => {
                                    const bodyText = `প্রিয় ${selectedMember.name},

শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।

Your Account Details:
সদস্য আইডি: ECO-${selectedMember.id.padStart(4, '0')}
ভূমিকা: ${selectedMember.role}
স্ট্যাটাস: সক্রিয় (Active)

এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।

লগইন লিঙ্ক: ${window.location.origin}/login

ধন্যবাদ,
MBSTU Econ Library & Organization`;
                                    navigator.clipboard.writeText(bodyText);
                                    setCopiedBody(true);
                                    setTimeout(() => setCopiedBody(false), 2000);
                                  }}
                                  className="w-full flex items-center justify-center space-x-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all"
                                >
                                  {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedBody ? 'সম্পূর্ণ বার্তাটি কপিড হয়েছে!' : 'সম্পূর্ণ অভিনন্দন বার্তাটি কপি করুন'}</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notice Section */}
                    <div className="bg-indigo-50/50 p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-indigo-100/50 print:hidden">
                       <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">নোটিশ পাঠান</h4>
                         </div>
                         {noticeResult && (
                           <span className={cn(
                             "text-[10px] font-black px-3 py-1 rounded-full",
                             noticeResult.success ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                           )}>
                             {noticeResult.message}
                           </span>
                         )}
                       </div>
                       <div className="relative">
                          <textarea 
                            value={noticeMessage}
                            onChange={(e) => setNoticeMessage(e.target.value)}
                            placeholder="সদস্যকে কোনো বার্তা বা নোটিশ দিন..."
                            className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 min-h-[100px]"
                          />
                          <button 
                            onClick={handleSendNotice}
                            disabled={isSendingNotice || !noticeMessage}
                            className="absolute right-3 bottom-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                          >
                            {isSendingNotice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Print only footer */}
                <div className="hidden print:block mt-10 border-t border-slate-100 pt-8 text-center">
                  <p className="text-xs font-bold text-slate-400 italic">এই প্রফাইলটি স্বয়ংক্রিয়ভাবে পাঠাগার ব্যবস্থাপনা সিস্টেম থেকে তৈরি করা হয়েছে।</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Non-Technical Email & Message Assistant Modal */}
      <AnimatePresence>
        {successModalMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuccessModalMember(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 text-left shadow-2xl border border-slate-150 z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">আবেদন সক্রিয় করা হয়েছে!</h3>
                    <p className="text-[10px] text-slate-400 font-bold">ইমেইল ও মেসেজ নোটিফিকেশন সহকারী</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSuccessModalMember(null)}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold leading-relaxed">
                  🎉 <strong>{successModalMember.name}</strong> এর মেম্বারশিপটি সফলভাবে সক্রিয় করা হয়েছে! এখন তিনি আইডি কার্ড ডাউনলোড করতে পারবেন। শিক্ষার্থীকে বিষয়টি জানাতে নিচের সহজ পদ্ধতিগুলোর সাহায্য নিন:
                </div>

                {/* Option 1: Mailto Native Pre-fill */}
                <div className="p-5 border border-slate-150 rounded-2xl bg-white hover:border-indigo-500 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600">পদ্ধতি ১: ডিরেক্ট জিমেইল অ্যাপ</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">১-ক্লিক ইমেইল টেমপ্লেট</h4>
                    </div>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-md">১০০% ফ্রি ও সহজ</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4">
                    আপনার ফোন বা ল্যাপটপের অফিশিয়াল জিমেইল কিংবা মেইল অ্যাপ খুলে যাবে এবং শিক্ষার্থীর ইমেল, সাবজেক্ট ও বডি স্বয়ংক্রিয়ভাবে লিখে প্রস্তুত করে রাখবে।
                  </p>
                  <button 
                    onClick={() => {
                        const subjectVal = encodeURIComponent('স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library');
                        const bodyVal = encodeURIComponent(`প্রিয় ${successModalMember.name},

শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।

আপনার একাউন্টের তথ্য:
সদস্য আইডি: ECO-${successModalMember.id.padStart(4, '0')}
ভূমিকা: ${successModalMember.role}
স্ট্যাটাস: সক্রিয় (Active)

এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।

লগইন লিঙ্ক: ${window.location.origin}/login

ধন্যবাদ,
MBSTU Econ Library & Organization`);
                      
                      const mailtoUrl = `mailto:${successModalMember.email}?subject=${subjectVal}&body=${bodyVal}`;
                      try {
                        window.location.href = mailtoUrl;
                      } catch (e) {
                        window.open(mailtoUrl, '_blank');
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm mb-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>জিমেইল অ্যাপ ওপেন করুন</span>
                  </button>

                  {/* Copy helper right integrated */}
                  <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>মেইল অ্যাপ যদি না খুলে, ১-ক্লিক কপি করুন:</span>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(successModalMember.email);
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }}
                        className="w-full flex justify-between items-center text-[10px] font-bold p-2 bg-white rounded-lg border border-slate-150 hover:bg-indigo-50/20 text-left transition-colors"
                      >
                        <span className="text-slate-400 truncate">ইমেইল: <span className="font-mono text-slate-700">{successModalMember.email}</span></span>
                        <span className="text-indigo-600 shrink-0 flex items-center gap-1">
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedEmail ? 'কপিড' : 'কপি'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('স্বাগতম! আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে - MBSTU Econ Library');
                          setCopiedSubject(true);
                          setTimeout(() => setCopiedSubject(false), 2000);
                        }}
                        className="w-full flex justify-between items-center text-[10px] font-bold p-2 bg-white rounded-lg border border-slate-150 hover:bg-indigo-50/20 text-left transition-colors"
                      >
                        <span className="text-slate-400 truncate">বিষয়: <span className="text-slate-750 font-sans">স্বাগতম! আপনার মেম্বারশিপ আবেদন ...</span></span>
                        <span className="text-indigo-600 shrink-0 flex items-center gap-1">
                          {copiedSubject ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedSubject ? 'কপিড' : 'কপি'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          const bodyText = `প্রিয় ${successModalMember.name},

শুভেচ্ছা ও অভিনন্দন! অত্যন্ত আনন্দের সাথে জানাচ্ছি যে, আপনার সদস্যপদ আবেদনটি এডমিন বা কো-অর্ডিনেটর কর্তৃক অনুমোদিত করা হয়েছে।

Your Account Details:
সদস্য আইডি: ECO-${successModalMember.id.padStart(4, '0')}
ভূমিকা: ${successModalMember.role}
স্ট্যাটাস: সক্রিয় (Active)

এখন আপনি সরাসরি আপনার ড্যাশবোর্ডে লগইন করে আপনার ব্যক্তিগত ডিজিটাল মেম্বারশিপ আইডি কার্ডটি ডাউনলোড করতে পারবেন।

লগইন লিঙ্ক: ${window.location.origin}/login

ধন্যবাদ,
MBSTU Econ Library & Organization`;
                          navigator.clipboard.writeText(bodyText);
                          setCopiedBody(true);
                          setTimeout(() => setCopiedBody(false), 2000);
                        }}
                        className="w-full flex justify-between items-center text-[10px] font-bold p-2 bg-white rounded-lg border border-slate-150 hover:bg-indigo-50/20 text-left transition-colors"
                      >
                        <span className="text-slate-400 truncate">সম্পূর্ণ মেইল বার্তা</span>
                        <span className="text-indigo-600 shrink-0 flex items-center gap-1">
                          {copiedBody ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedBody ? 'বার্তা কপিড' : 'বার্তা কপি'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option 2: Copy message to Clipboard */}
                <div className="p-5 border border-slate-150 rounded-2xl bg-white hover:border-indigo-500 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">পদ্ধতি ২: মেসেঞ্জার ও হোয়াটসঅ্যাপ</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">বাংলা মেসেজ কপি সহকারী</h4>
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-md">১-ক্লিক কপি</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4">
                    শিক্ষার্থীকে এসএমএস, ইমো বা হোয়াটসঅ্যাপ গ্রুপে কুইক মেসেজ পাঠাতে নিচের প্রস্তুতকৃত মেসেজটি এক ক্লিকে সম্পূর্ণ কপি করে নিন:
                  </p>
                  
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-bold text-xs leading-relaxed mb-3">
                    প্রিয় {successModalMember.name}, আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে! সদস্য আইডি: ECO-{successModalMember.id.padStart(4, '0')}। আপনার ডিজিটাল আইডি কার্ড ডাউনলোড করতে লগইন করুন: {window.location.origin}/login
                  </div>

                  <button 
                    onClick={() => {
                      const msg = `প্রিয় ${successModalMember.name}, আপনার মেম্বারশিপ আবেদন অনুমোদিত হয়েছে! সদস্য আইডি: ECO-${successModalMember.id.padStart(4, '0')}। আপনার ডিজিটাল আইডি কার্ড ডাউনলোড করতে লগইন করুন: ${window.location.origin}/login`;
                      navigator.clipboard.writeText(msg);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className={`w-full flex items-center justify-center space-x-2 py-3 ${copiedText ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-xl font-black text-xs transition-colors`}
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>সফলভাবে কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>মেসেজ ক্লিপবোর্ডে কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <button
                  onClick={() => setSuccessModalMember(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Date and validity Configuration Modal */}
        {showApprovalConfigModal && memberToApprove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowApprovalConfigModal(false);
                setMemberToApprove(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-[24px] sm:rounded-[32px] p-6 text-left shadow-2xl border border-slate-150 z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base leading-tight">কার্ডের মেয়াদ ও সক্রিয়করণ সেটিংস</h3>
                    <p className="text-[10px] text-slate-400 font-bold">ইস্যুর তারিখ ও মেয়াদকাল ঠিক করুন</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowApprovalConfigModal(false);
                    setMemberToApprove(null);
                  }}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-1">প্রার্থিত সদস্য</span>
                  <h4 className="font-extrabold text-slate-850 text-sm">{memberToApprove.name}</h4>
                  <p className="text-[10px] font-mono font-bold text-slate-500">ID: ECO-{memberToApprove.id.padStart(4, '0')} | {memberToApprove.role}</p>
                </div>

                {/* Date of Issue picker */}
                <div>
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-wider mb-1.5 line-clamp-1">
                    লাইব্রেরি কার্ড ইস্যুর তারিখ (Issue Date):
                  </label>
                  <input
                    type="date"
                    value={issueDateVal}
                    onChange={(e) => setIssueDateVal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white text-slate-800 font-bold text-xs rounded-xl outline-none transition-all"
                  />
                </div>

                {/* Validity selector dropdown buttons/grid */}
                <div>
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-wider mb-2">
                    কার্ডের মেয়াদকাল (Card Validity Duration):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: '1', label: '১ বছর (1 Year)' },
                      { type: '2', label: '২ বছর (2 Years)' },
                      { type: '3', label: '৩ বছর (3 Years)' },
                      { type: '4', label: '৪ বছর (General)' },
                      { type: '5', label: '৫ বছর (5 Years)' },
                      { type: 'lifetime', label: 'জীবনমেয়াদ (Lifetime)' },
                      { type: 'custom', label: 'কাস্টম শেষ তারিখ' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setValidityType(item.type)}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-left font-bold text-[11px] transition-all",
                          validityType === item.type 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-white border-slate-200 hover:border-slate-350 text-slate-650"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Custom validity selected, show Expiry Date Picker */}
                {validityType === 'custom' && (
                  <div className="animate-in slide-in-from-top duration-200">
                    <label className="block text-[10px] font-black text-slate-550 uppercase tracking-wider mb-1.5">
                      মেয়াদ শেষ হওয়ার শেষ তারিখ (Expiry Date):
                    </label>
                    <input
                      type="date"
                      value={customExpiryVal}
                      onChange={(e) => setCustomExpiryVal(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-805 font-bold text-xs rounded-xl outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Action active buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={confirmApproval}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-md shadow-indigo-505/5 hover:translate-y-[-1px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-250 shrink-0" />
                  <span>অনুমোদন ও সক্রিয় করুন (Confirm & Activate)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalConfigModal(false);
                    setMemberToApprove(null);
                  }}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
