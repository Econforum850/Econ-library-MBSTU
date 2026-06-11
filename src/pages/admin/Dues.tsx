import React, { useState, useEffect } from 'react';
import { 
  Wallet, Search, RefreshCw, 
  Loader2, CheckCircle2, AlertCircle,
  FileText, ArrowDownRight, User, X, CheckSquare, Plus, Printer, Calendar,
  BookOpen, Clock, ShieldAlert, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  db, 
  SupabaseMember as SheetMember, 
  SupabaseIssue, 
  SupabaseBook, 
  calculateYearlyFeesOwedOnly, 
  calculateDues,
  parseAnyDate, 
  getMonthsBetween 
} from '@/src/lib/supabaseDatabase';

export default function AdminDues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMembers, setAllMembers] = useState<SheetMember[]>([]);
  const [issues, setIssues] = useState<SupabaseIssue[]>([]);
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'with-dues'>('with-dues');
  const [activeSection, setActiveSection] = useState<'ledger' | 'penalty'>('ledger');
  const [isProcessingCollection, setIsProcessingCollection] = useState(false);

  // Collect dues modal states
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SheetMember | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDate, setCollectDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Add/Charge custom due modal states
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeMember, setChargeMember] = useState<SheetMember | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [chargeReason, setChargeReason] = useState('বাৎসরিক বিলম্ব ফি/অন্যান্য');
  const [isSavingCharge, setIsSavingCharge] = useState(false);

  // Print Report modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Expanded member breakdown details
  const [expandedMembers, setExpandedMembers] = useState<{[memberId: string]: boolean}>({});
  const [sendingEmailMap, setSendingEmailMap] = useState<{[memberId: string]: boolean}>({});

  const toggleMemberExpanded = (memberId: string) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleSendEmailStatement = async (member: SheetMember) => {
    if (!member.email) {
      alert('⚠️ এই সদস্যের কোনো ইমেইল ঠিকানা পাওয়া যায়নি!');
      return;
    }

    try {
      setSendingEmailMap(prev => ({ ...prev, [member.id]: true }));

      const yearlyFee = calculateYearlyFeesOwedOnly(member);
      const otherAdjustments = member.baseDues ?? 0;

      // Find active/overdue items for the user
      const memberIssues = issues.filter(i => 
        (i.memberId === member.id || i.memberName === member.name)
      );
      const activeOverdueIssues = memberIssues.filter(i => 
        i.status === 'Active' || i.status === 'Overdue'
      );

      let activeLateFeesSum = 0;
      const overdueBreakdown = activeOverdueIssues.map(issue => {
        const daysRem = getDaysRemainingValue(issue.dueDate);
        const daysOverdue = daysRem < 0 ? Math.abs(daysRem) : 0;
        let computedFee = daysOverdue * 5;
        if (issue.fineWaived) {
          computedFee = 0;
        } else if (issue.customFineAmount !== undefined && issue.customFineAmount !== null) {
          computedFee = issue.customFineAmount;
        }
        activeLateFeesSum += computedFee;
        return {
          bookTitle: issue.bookTitle,
          dueDate: issue.dueDate,
          daysOverdue,
          fee: computedFee
        };
      }).filter(item => item.fee > 0 || item.daysOverdue > 0);

      const computedTotal = calculateDues(member);

      const emailSubject = `লাইব্রেরি বকেয়া ও বিলম্ব জরিমানা স্টেটমেন্ট (Library Dues & Fee Statement) - ${member.name}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
            <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
          </div>
          <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: bold;">প্রিয় ${member.name},</p>
            <p>আপনার অ্যাকাউন্ট আইডি <strong>ECO-${member.id.padStart(4, '0')}</strong> এর অধীনে বকেয়া লাইব্রেরি ফি ও বিলম্ব জরিমানার সামগ্রিক বিবরণ নিচে দেওয়া হলো:</p>
            
            <div style="background-color: #fffaf0; border: 1px solid #fbd38d; padding: 18px; border-radius: 12px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #dd6b20; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">বকেয়া হিসাবের সারসংক্ষেপ (Statement Summary):</p>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">১. মেম্বারশিপ বাৎসরিক ফি (Membership Fee):</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0; text-align: right;">৳${yearlyFee}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">২. অন্যান্য বকেয়া ও ম্যানুয়াল অ্যাডজাস্টমেন্ট (Other Charges):</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0; text-align: right;">৳${otherAdjustments}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">৩. চলমান বিলম্ব জরিমানা (Estimated Late Fees):</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0; text-align: right;">৳${activeLateFeesSum}</td>
                </tr>
                <tr style="background-color: #fef2f2;">
                  <td style="padding: 12px 6px; color: #991b1b; font-weight: 900; border-top: 2px solid #fecaca;">সর্বমোট বকেয়ার পরিমাণ (Account Balance):</td>
                  <td style="padding: 12px 6px; color: #b91c1c; font-weight: 900; text-align: right; border-top: 2px solid #fecaca; font-size: 16px;">৳${computedTotal}</td>
                </tr>
              </table>
            </div>

            ${overdueBreakdown.length > 0 ? `
              <div style="margin-top: 20px;">
                <p style="font-weight: bold; color: #4f46e5; font-size: 14px; margin-bottom: 10px;">বই ফেরত বিলম্ব বিবরণী (Overdue Books Breakdown):</p>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                      <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">বইয়ের নাম (Book)</th>
                      <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">ফেরতের শেষ তারিখ</th>
                      <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">বিলম্ব দিনসমূহ</th>
                      <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">জরিমানা</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${overdueBreakdown.map(item => `
                      <tr>
                        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${item.bookTitle}</td>
                        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${item.dueDate}</td>
                        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #ef4444; font-weight: bold;">${item.daysOverdue} দিন</td>
                        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #b91c1c;">৳${item.fee}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <p style="margin-top: 25px;">যেকোনো ধরনের অসামঞ্জস্য মনে হলে বিভাগীয় সেমিনারে উপস্থিত হয়ে হিসাব মিলিয়ে নেওয়ার জন্য অনুরোধ করা হলো। অতি দ্রুত বকেয়া পরিশোধ করে সম্মানিত মেম্বারশিপ সুবিধাসমূহ সচল রাখুন।</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
          </div>
        </div>
      `;

      await db.sendEmailWithLog({
        to: member.email,
        subject: emailSubject,
        html: emailHtml,
        type: 'DUE_STATEMENT'
      });

      try {
        await db.addAuditLog('SEND_STATEMENT', `বকেয়া বিবরণী ইমেইল করা হয়েছে: সদস্য: ${member.name} (ইমেইল: ${member.email}, মোট বকেয়া: ৳${computedTotal})`);
      } catch (_) {}

      alert(`✅ '${member.name}' এর ইমেইলে (${member.email}) বকেয়া স্টেটমেন্ট বিবরণী সফলভাবে প্রেরণ করা হয়েছে!`);
    } catch (err) {
      console.error('[Mail Error] Failed to send statement notification email:', err);
      alert('ইমেইল প্রেরণ সম্ভব হয়নি বা জিমেইল সার্ভার ত্রুটি।');
    } finally {
      setSendingEmailMap(prev => ({ ...prev, [member.id]: false }));
    }
  };

  const formatDateToSlash = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const parseSlashedDate = (slashDateStr: string): Date | null => {
    if (!slashDateStr) return null;
    const parts = slashDateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  };

  const getDaysRemainingValue = (dueDateStr: string): number => {
    const parsed = parseSlashedDate(dueDateStr);
    if (!parsed) return 9999;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    
    const diffTime = parsed.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toBengaliNumber = (num: number | string): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchedMems = await db.getMembers();
      // Only keep accepted or active members for dues ledger
      const validMembers = fetchedMems.filter(m => m.status === 'accepted' || m.status === 'active');
      setAllMembers(validMembers);

      const fetchedIssues = await db.getIssues();
      setIssues(fetchedIssues);

      const fetchedBooks = await db.getBooks();
      setBooks(fetchedBooks);
    } catch (err) {
      console.error('Dues loaded data details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCollectModal = (member: SheetMember) => {
    setSelectedMember(member);
    const numericDue = parseInt(String(member.dues).replace(/[^0-9]/g, '')) || 0;
    setCollectAmount(String(numericDue));
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setCollectDate(`${yyyy}-${mm}-${dd}`);
    setIsCollectModalOpen(true);
  };

  const openChargeModal = (member: SheetMember) => {
    setChargeMember(member);
    setChargeAmount('50');
    setChargeReason('বাৎসরিক মেম্বারশিপ বকেয়া ফি');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setChargeDate(`${yyyy}-${mm}-${dd}`);
    setIsChargeModalOpen(true);
  };

  const handleCollectDuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const amountToDeduct = parseInt(collectAmount) || 0;
    const currentDue = parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 0;

    if (amountToDeduct <= 0) {
      alert('সদস্যের বকেয়া পরিশোধের জন্য সঠিক টাকার পরিমাণ দিন!');
      return;
    }

    try {
      setIsSavingCollection(true);
      const updatedDue = Math.max(0, currentDue - amountToDeduct);
      
      const updatedMember = {
        ...selectedMember,
        dues: updatedDue
      };

      // 1. Update member state in DB
      await db.saveMember(updatedMember);

      // 2. Add an income transaction trace to Finances module
      const formattedDate = formatDateToSlash(collectDate);
      await db.saveTransaction({
        type: 'income',
        category: 'বকেয়া সংগ্রহ (ফি)',
        amount: amountToDeduct,
        date: formattedDate,
        status: 'Completed',
        note: `${selectedMember.name} (ID: ${selectedMember.id}) এর বকেয়া পরিশোধ - আদায় তারিখ: ${formattedDate}`
      });

      try {
        await db.addAuditLog('COLLECT_DUES', `বকেয়া ফি সংগ্রহ করা হয়েছে: ৳${amountToDeduct} -> সদস্য: ${selectedMember.name} (ID: ${selectedMember.id})`);
      } catch (_) {}

      // Auto Gmail dispatch for dues collection
      if (selectedMember.email) {
        try {
          const emailSubject = `বকেয়া পরিশোধ রসিদ (Dues Payment Receipt) - MBSTU Econ Library`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
                <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
              </div>
              <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; font-weight: bold;">প্রিয় ${selectedMember.name},</p>
                <p>আপনার বকেয়া লাইব্রেরি পেমেন্ট সফলভাবে সংগ্রহ করা হয়েছে। নিচে আদায় বিবরণী প্রদান করা হলো:</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #10b981; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">পেমেন্ট রসিদ (Payment Details):</p>
                  <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">সদস্যের নাম ও আইডি:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${selectedMember.name} (ID: ${selectedMember.id})</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">পরিশোধিত টাকার পরিমাণ:</td>
                      <td style="padding: 8px 0; color: #10b981; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">৳${amountToDeduct} (আদায়কৃত)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">অবशिष्ट মোট বকেয়া (Current Dues):</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">৳${updatedDue}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">আদায়ের তারিখ:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${formattedDate}</td>
                    </tr>
                  </table>
                </div>
                <p>পেমেন্ট পরিশোধের মাধ্যমে লাইব্রেরি সচল রাখতে সাহায্য করার জন্য ধন্যবাদ!</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
              <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
              </div>
            </div>
          `;

          await db.sendEmailWithLog({
            to: selectedMember.email,
            subject: emailSubject,
            html: emailHtml,
            type: 'DUES_PAYMENT'
          });
        } catch (mailErr) {
          console.error('[Mail Error] Failed to send payment confirmation email:', mailErr);
        }
      }

      alert(`৳${amountToDeduct} সফলভাবে আদায় করা হয়েছে এবং হিসাব-নিকাশ মডিউলে জমা হয়েছে!`);
      setIsCollectModalOpen(false);
      setSelectedMember(null);
      await loadData();
    } catch (err) {
      console.error('Collect dues error:', err);
      alert('বকেয়া সংগ্রহ সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleChargeDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeMember) return;
    const amountToCharge = parseInt(chargeAmount) || 0;
    const currentDue = parseInt(String(chargeMember.dues).replace(/[^0-9]/g, '')) || 0;

    if (amountToCharge <= 0) {
      alert('সদরিক ও বৈধ বকেয়া চার্জের পরিমাণ প্রদান করুন!');
      return;
    }

    try {
      setIsSavingCharge(true);
      const updatedDue = currentDue + amountToCharge;
      
      const updatedMember = {
        ...chargeMember,
        dues: updatedDue
      };

      // Update member state in DB
      await db.saveMember(updatedMember);

      const formattedDate = formatDateToSlash(chargeDate);
      try {
        await db.addAuditLog('CHARGE_DUES', `বকেয়া চার্জ করা হয়েছে: ৳${amountToCharge} -> সদস্য: ${chargeMember.name} (ID: ${chargeMember.id}) - কারণ: ${chargeReason}`);
      } catch (_) {}

      // Auto Gmail dispatch for new charges (damages, penalties, library card, etc.)
      if (chargeMember.email) {
        try {
          const emailSubject = `বকেয়া জরিমানা চার্জ নোটিশ (New Outstanding Charge Notice) - MBSTU Econ Library`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">
                <h2 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
                <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
              </div>
              <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; font-weight: bold;">প্রিয় ${chargeMember.name},</p>
                <p>আপনার অ্যাকাউন্টে নতুন লাইব্রেরি বকেয়া/জরিমানা চার্জ যুক্ত হয়েছে। বিবরণ নিচে দেওয়া হলো:</p>
                
                <div style="background-color: #fffaf0; border: 1px solid #fbd38d; padding: 18px; border-radius: 12px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #dd6b20; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">বকেয়া বিবরণী (Charge Details):</p>
                  <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">সদস্যের নাম ও আইডি:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${chargeMember.name} (ID: ${chargeMember.id})</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">যুক্ত হওয়া টাকার পরিমাণ:</td>
                      <td style="padding: 8px 0; color: #ef4444; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">৳${amountToCharge} (চার্জকৃত)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">বকেয়া যুক্ত করার কারণ (Reason):</td>
                      <td style="padding: 8px 0; color: #dd6b20; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${chargeReason || 'ড্যামেজ/বিলম্ব নোটিশ'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">মোট পরিশোধযোগ্য বকেয়া (Total Dues):</td>
                      <td style="padding: 8px 0; color: #ef4444; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">৳${updatedDue}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">চার্জের তারিখ & সময়:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${formattedDate}</td>
                    </tr>
                  </table>
                </div>
                <p>সবচেয়ে দ্রুততম সময়ে এই বকেয়া সরাসরি বিভাগের সেমিনারে উপস্থিত হয়ে পরিশোধ করার জন্য অনুরোধ করা হলো।</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
              <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
              </div>
            </div>
          `;

          await db.sendEmailWithLog({
            to: chargeMember.email,
            subject: emailSubject,
            html: emailHtml,
            type: 'DUES_CHARGE'
          });
        } catch (mailErr) {
          console.error('[Mail Error] Failed to send charge notification email:', mailErr);
        }
      }

      alert(`৳${amountToCharge} বকেয়া সফলভাবে সদস্য '${chargeMember.name}' এর অ্যাকাউন্টে যোগ করা হয়েছে!`);
      setIsChargeModalOpen(false);
      setChargeMember(null);
      await loadData();
    } catch (err) {
      console.error('Charge due error:', err);
      alert('বকেয়া চার্জ সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSavingCharge(false);
    }
  };

  const handleConfirmCollectedReturn = async (issue: SupabaseIssue, fineAmount: number, overdueDays: number) => {
    const isConfirmed = window.confirm(
      `⚠️ বই ফেরত সংগ্রহ এবং ফাইন নিষ্পত্তি নোটিশ:\n\n` +
      `সদস্য: ${issue.memberName}\n` +
      `বইয়ের নাম: ${issue.bookTitle}\n` +
      `বিলম্ব অতিবাহিত: ${overdueDays} দিন\n` +
      `হিসাবকৃত লেট ফি জরিমানা: ৳${fineAmount} টাকা (রেট: ৫ টাকা/দিন)\n\n` +
      `আপনি কি নিশ্চিত করছেন যে বইটি শিক্ষার্থীর কাছ থেকে সফলভাবে ফেরত বুঝে পেয়েছেন (collected successfully)?`
    );

    if (!isConfirmed) return;

    try {
      setIsProcessingCollection(true);

      // 1. Find book and decrement issuedCopies (increasing stock available)
      const matchedBook = books.find(b => b.id === issue.bookId || b.title.trim().toLowerCase() === issue.bookTitle.trim().toLowerCase());
      if (matchedBook) {
        const currentIssued = matchedBook.issuedCopies !== undefined ? Number(matchedBook.issuedCopies) : 0;
        const currentStock = matchedBook.stock !== undefined ? Number(matchedBook.stock) : 0;
        const updatedBook = {
          ...matchedBook,
          issuedCopies: Math.max(0, currentIssued - 1),
          stock: currentStock + 1
        };
        await db.saveBook(updatedBook);
      }

      // 2. Mark issue status as 'Returned'
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const pickupDateSlash = `${dd}/${mm}/${yyyy}`;

      const updatedIssue: SupabaseIssue = {
        ...issue,
        status: 'Returned',
        pickupDate: pickupDateSlash,
        notes: (issue.notes || '') + ` | Collected & returned on ${pickupDateSlash} (Fine resolved)`
      };
      await db.saveIssue(updatedIssue);

      // 3. Resolve fine options
      let resolvedMember = allMembers.find(m => m.id === issue.memberId || m.name.trim() === issue.memberName.trim());
      
      if (fineAmount > 0) {
        const isCashCollected = window.confirm(
          `💰 জরিমানা প্রাপ্তি ডিক্লিয়ারেশন:\n\n` +
          `লেট ফাইনের পরিমাণ ৳${fineAmount} টাকা সম্পূর্ণ আদায় করা সম্ভব হয়েছে?\n\n` +
          `• 'OK' প্রেস করুন: নগদ জরিমানা আদায় হয়েছে (এটি সরাসরি ফাইন্যান্স মডিউলে আয় হিসেবে জমা দেখাবে)।\n` +
          `• 'Cancel' প্রেস করুন: জরিমানার পরিমাণ এই শিক্ষার্থীর বকেয়া হিসেবে অ্যাকাউন্টে যোগ করা হবে, যা পরে প্রদান করতে পারবে।`
        );

        if (isCashCollected) {
          // Add income trace directly of fineAmount
          await db.saveTransaction({
            type: 'income',
            category: 'বিলম্ব জরিমানা আদায়',
            amount: fineAmount,
            date: `${dd}/${mm}/${yyyy}`,
            status: 'Completed',
            note: `${issue.memberName} (ID: ${issue.memberId || 'N/A'}) - বিলম্ব জরিমানা নগদ আদায় - বই: ${issue.bookTitle}`
          });

          try {
            await db.addAuditLog('BOOK_RETURN_FINE_COLLECTED_CASH', `বই অফলাইনে ফেরত ও বিলম্ব জরিমানা নগদ আদায়: ৳${fineAmount} -> সদস্য: ${issue.memberName} (বই: ${issue.bookTitle})`);
          } catch (_) {}

          alert(`সাফল্যের সাথে বইটি ডিউ রিটার্ন করা হয়েছে এবং ৳${fineAmount} টাকা জরিমানার নগদ রসিদ ক্যাশবুকে জমা করা হয়েছে।`);
        } else {
          // Add to student's outstanding accounts dues balance
          if (resolvedMember) {
            const currentDues = parseInt(String(resolvedMember.dues).replace(/[^0-9]/g, '')) || 0;
            const updatedMember = {
              ...resolvedMember,
              dues: currentDues + fineAmount
            };
            await db.saveMember(updatedMember);

            try {
              await db.addAuditLog('BOOK_RETURN_FINE_UNPAID_ADDED_TO_LEDGER', `বই অফলাইনে ফেরত ও বিলম্ব জরিমানা লেজারে যোগ: ৳${fineAmount} -> সদস্য: ${issue.memberName} (বই: ${issue.bookTitle})`);
            } catch (_) {}

            alert(`বইটি লাইব্রেরিতে ফেরত নেওয়া হয়েছে। জরিমানা ৳${fineAmount} টাকা শিক্ষার্থীর বকেয়া ব্যালেন্সে যোগ করা হয়েছে যা সদস্য বকেয়া লেজার থেকে পরিশোধ করতে পারবে।`);
          } else {
            alert(`বইটি লাইব্রেরিতে ফেরত নেওয়া হয়েছে। সদস্য প্রোফাইল পাওয়া না যাওয়ায় সরাসরি জরিমানা নগদ পরিশোধ ধরে নেওয়া হয়েছে।`);
          }
        }
      } else {
        try {
          await db.addAuditLog('BOOK_RETURN_NO_FINE', `বই অফলাইনে ফেরত গ্রহণ (মেয়াদের মধ্যে): সদস্য: ${issue.memberName} (বই: ${issue.bookTitle})`);
        } catch (_) {}
        alert('বইটি সফলভাবে কোনো বিলম্ব জরিমানা ছাড়াই লাইব্রেরিতে ফেরত বুঝে নেওয়া হয়েছে!');
      }

      await loadData();
    } catch (err) {
      console.error('Error in collected return payment flow:', err);
      alert('বই সংগ্রহ নির্ধারণ ও জরিমানা নিষ্পত্তিতে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsProcessingCollection(false);
    }
  };

  const handleWaiveOrResolveFineDirectly = async (issue: SupabaseIssue, fineAmount: number) => {
    const isWaived = window.confirm(
      `⚠️ জরিমানা মওকুফ / রিজলভ করার নিশ্চয়তা:\n\n` +
      `সদস্য: ${issue.memberName}\n` +
      `বইয়ের নাম: ${issue.bookTitle}\n` +
      `চলতি জরিমানা পরিমাণ: ৳${fineAmount} টাকা\n\n` +
      `আপনি কি এই জরিমানার টাকা মওকুফ করতে চান এবং ফাইনটি সমাধান হিসেবে চিহ্নিত করতে চান?`
    );

    if (!isWaived) return;

    try {
      setIsProcessingCollection(true);

      // We mark the status in issue or write notes, or we just keep the issue but add notes that fine was waived
      const updatedIssue: SupabaseIssue = {
        ...issue,
        notes: (issue.notes || '') + ` | Penalty of ৳${fineAmount} waived by admin`
      };
      await db.saveIssue(updatedIssue);

      try {
        await db.addAuditLog('OVERDUE_FINE_WAIVED', `বিলম্ব জরিমানা মওকুফ করা হয়েছে: সদস্য: ${issue.memberName} - বই: ${issue.bookTitle} (জরিমানা: ৳${fineAmount})`);
      } catch (_) {}

      alert('লেট ফি জরিমানা সফলভাবে মওকুফ করে রিজলভ হিসেবে চিহ্নিত করা হয়েছে!');
      await loadData();
    } catch (err) {
      console.error('Error waiving fine:', err);
      alert('জরিমানা মওকুফে সমস্যা হয়েছে।');
    } finally {
      setIsProcessingCollection(false);
    }
  };

  // Filter members based on rules
  const membersToRender = allMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'with-dues') {
      const dueVal = parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0;
      return dueVal > 0;
    }
    return true;
  });

  const totalDuesOfAll = allMembers.reduce((acc, m) => acc + (parseInt(String(m.dues).replace(/[^0-9]/g, '')) || 0), 0);

  const handleTriggerPrint = () => {
    try {
      window.print();
    } catch (e) {
      alert('আইফ্রেম রেস্ট্রিকশনের কারণে সরাসরি প্রিন্ট ব্যাহত হতে পারে। দয়া করে নতুন ট্যাবে খুলে ট্রাই করুন।');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left print:p-0">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্যদের বকেয়া ও ফি ব্যবস্থাপনা</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">সব সদস্যদের বাৎসরিক ফি ও অন্যান্য বকেয়া তালিকা ও হিসাব</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[22px] font-black text-slate-700 transition-all text-xs active:scale-95"
          >
            <Printer className="w-4.5 h-4.5 text-indigo-500" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
          <div className="flex items-center space-x-3 bg-rose-50 p-2.5 rounded-[28px] border border-rose-100">
              <div className="px-6 py-2.5 bg-white rounded-[20px] shadow-xs">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block text-center mb-0.5">সর্বমোট বকেয়া পরিমাণ</span>
                  <span className="text-2xl font-black text-rose-600 block text-center">৳{totalDuesOfAll}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Section Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-[32px] border border-slate-200/40 print:hidden">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-full sm:max-w-md">
          <button
            onClick={() => setActiveSection('ledger')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2",
              activeSection === 'ledger' ? "bg-rose-50 text-rose-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>বকেয়া লেজার (Ledger)</span>
          </button>
          <button
            onClick={() => setActiveSection('penalty')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 relative",
              activeSection === 'penalty' ? "bg-rose-600 text-white shadow-md shadow-rose-200" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>পেনাল্টি জরিমানা ({toBengaliNumber(
              issues.filter(i => {
                const rem = getDaysRemainingValue(i.dueDate);
                return (i.status === 'Active' || i.status === 'Overdue') && rem < 0;
              }).length
            )})</span>
          </button>
        </div>
        <p className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wide">
          {activeSection === 'ledger' ? 'সব সদস্যদের সাধারণ অ্যাকাউন্টস বকেয়া লেজার' : 'ওভারডিউ বই ট্র্যাকিং ও বিলম্ব জরিমানা (৫৳/দিন)'}
        </p>
      </div>

      {activeSection === 'ledger' ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
              <div className="relative w-full md:w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all placeholder:text-slate-400"
                  />
              </div>
              <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end">
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => setFilterType('with-dues')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                        filterType === 'with-dues' ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:text-slate-850"
                      )}
                    >
                      বকেয়া তালিকা ({allMembers.filter(m => (parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0) > 0).length})
                    </button>
                    <button
                      onClick={() => setFilterType('all')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                        filterType === 'all' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:text-slate-850"
                      )}
                    >
                      সকল সক্রিয় সদস্য ({allMembers.length})
                    </button>
                  </div>
                  <button 
                    onClick={loadData}
                    disabled={loading}
                    className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                    title="রিফ্রেশ করুন"
                  >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                  </button>
              </div>
          </div>

          {loading && allMembers.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-5">সদস্য (Member)</th>
                    <th className="px-8 py-5">মোবাইল ফোন</th>
                    <th className="px-8 py-5">বকেয়া পরিমাণ (Balance)</th>
                    <th className="px-8 py-5">সক্রিয়তার তারিখ</th>
                    <th className="px-8 py-5 text-right print:hidden">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {membersToRender.map((member) => {
                    const mDues = parseInt(String(member.dues || '0').replace(/[^0-9]/g, '')) || 0;
                    const isExpanded = !!expandedMembers[member.id];

                    const yearlyFee = calculateYearlyFeesOwedOnly(member);
                    const baseDuesValue = member.baseDues ?? 0;

                    // Gather member issues
                    const memberIssues = issues.filter(i => 
                      i.memberId === member.id || i.memberName === member.name
                    );
                    const activeOverdueIssues = memberIssues.filter(i => 
                      i.status === 'Active' || i.status === 'Overdue'
                    );

                    let activeLateFeesSum = 0;
                    const overdueBreakdown = activeOverdueIssues.map(issue => {
                      const daysRem = getDaysRemainingValue(issue.dueDate);
                      const daysOverdue = daysRem < 0 ? Math.abs(daysRem) : 0;
                      let computedFee = daysOverdue * 5;
                      if (issue.fineWaived) {
                        computedFee = 0;
                      } else if (issue.customFineAmount !== undefined && issue.customFineAmount !== null) {
                        computedFee = issue.customFineAmount;
                      }
                      activeLateFeesSum += computedFee;
                      return {
                        bookTitle: issue.bookTitle,
                        dueDate: issue.dueDate,
                        daysOverdue,
                        fee: computedFee
                      };
                    }).filter(item => item.fee > 0 || item.daysOverdue > 0);

                    return (
                      <React.Fragment key={member.id}>
                        <tr className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => toggleMemberExpanded(member.id)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700 shrink-0"
                                title="বিস্তারিত হিসাব ও বকেয়া ব্রেকডাউন দেখুন"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 font-extrabold rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                                <p className="text-[10px] font-bold text-slate-400">ECO-{member.id.padStart(4, '0')} | {member.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-600 font-bold font-mono">{member.phone || 'N/A'}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "font-black text-base px-3 py-1 rounded-full",
                              mDues > 0 ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-emerald-600 bg-emerald-50 border border-emerald-100"
                            )}>
                              ৳ {mDues}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-slate-400 font-bold">
                            {member.joinDate ? member.joinDate.split('|')[0] : 'N/A'}
                          </td>
                          <td className="px-8 py-6 text-right print:hidden">
                            <div className="flex items-center justify-end gap-2.5">
                              <button 
                                onClick={() => openChargeModal(member)}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                                title="বকেয়া চার্জ বা বিলম্ব ফি যোগ করুন"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ফি চার্জ করুন</span>
                              </button>
                              {mDues > 0 && (
                                <button 
                                  onClick={() => openCollectModal(member)}
                                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-1"
                                >
                                  <ArrowDownRight className="w-4 h-4" />
                                  <span>টাকা আদায়</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={5} className="px-8 py-5 border-t border-b border-rose-100">
                              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm space-y-4 text-left">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                      <span>বকেয়া ও জরিমানা হিসাব বিবরণী (Fee & Fine Breakdown)</span>
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400 mt-1">সব বকেয়া ক্যাটাগরির বিস্তারিত বিশ্লেষণ ও হিসাব</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleSendEmailStatement(member)}
                                      disabled={sendingEmailMap[member.id]}
                                      className={cn(
                                        "flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                                      )}
                                    >
                                      {sendingEmailMap[member.id] ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>স্টেটমেন্ট পাঠানো হচ্ছে...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                          <span>ইমেইল বিবরণী (Email Statement)</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block mb-1">১. সদস্যপদ বাৎসরিক ফি (Membership Fee)</span>
                                    <p className="text-slate-800 text-sm font-black">৳ {yearlyFee}</p>
                                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">ভ্যালিডেশন কন্ট্রিবিউশন ৫৳ প্রতি মাস এবং বাৎসরিক ৫০৳ রি-অ্যাক্টিভেশন ফি সহ</p>
                                  </div>
                                  
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block mb-1">২. অ্যাকাউন্ট সমন্বয় ও সাজা (Other Surcharges)</span>
                                    <p className="text-slate-800 text-sm font-black">৳ {baseDuesValue}</p>
                                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">ম্যানুয়াল বকেয়া চার্জ, নতুন রি-ইস্যু বা লাইব্রেরি ড্যামেজ পেমেন্ট</p>
                                  </div>

                                  <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100">
                                    <span className="text-[10px] text-rose-500 block mb-1">৩. রানিং বিলম্ব জরিমানা (Running Late Fees)</span>
                                    <p className="text-rose-700 text-sm font-black">৳ {activeLateFeesSum}</p>
                                    <p className="text-[9px] text-rose-400 mt-1 leading-relaxed">আপনার ফেরত না দেওয়া সকল অ্যাক্টিভ লোন বইয়ের ৫৳/দিন বিলম্ব জরিমানা</p>
                                  </div>
                                </div>

                                {overdueBreakdown.length > 0 && (
                                  <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-slate-50/20 text-xs text-left">
                                    <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200 font-extrabold text-slate-700">
                                      বিলম্বিত বইয়ের তালিকা ও লেট ফি বিবরণী
                                    </div>
                                    <div className="divide-y divide-slate-150">
                                      {overdueBreakdown.map((item, idx) => (
                                        <div key={idx} className="px-5 py-3.5 flex justify-between items-center bg-white">
                                          <div>
                                            <p className="font-extrabold text-slate-800">{item.bookTitle}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">পূর্ণ ফেরত প্রদানের নির্ধারিত তারিখ: {item.dueDate} | {item.daysOverdue} দিন অতিক্রান্ত</p>
                                          </div>
                                          <div className="text-right font-black text-rose-600 space-y-0.5">
                                            <p>+৳{item.fee}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {membersToRender.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                              <CheckCircle2 className="w-12 h-12 text-emerald-250 mx-auto mb-4 animate-bounce" />
                              <p className="text-slate-500 font-extrabold text-sm">উপযুক্ত কোনো সদস্যের তথ্য পাওয়া যায়নি!</p>
                              <p className="text-xs text-slate-400 font-medium mt-1">সব সদস্যদের হিসেব হালনাগাদ রয়েছে।</p>
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xs">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">মোট ওভারডিউ বইয়ের সংখ্যা</span>
              <span className="text-3xl font-black text-slate-900 leading-none">
                {toBengaliNumber(issues.filter(i => {
                  const daysRemaining = getDaysRemainingValue(i.dueDate);
                  return (i.status === 'Active' || i.status === 'Overdue') && daysRemaining < 0;
                }).length)} টি
              </span>
              <p className="text-xs font-bold text-slate-400 mt-2">নির্ধারিত ফেরত তারিখ অতিক্রান্ত হয়ে যাওয়া বই</p>
            </div>
            
            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xs">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1 font-sans">প্রাক্কলিত মোট জরিমানার পরিমাণ</span>
              <span className="text-3xl font-black text-amber-600 leading-none">
                ৳{toBengaliNumber(
                  issues
                    .filter(i => {
                      const daysRemaining = getDaysRemainingValue(i.dueDate);
                      return (i.status === 'Active' || i.status === 'Overdue') && daysRemaining < 0;
                    })
                    .reduce((sum, i) => sum + (Math.abs(getDaysRemainingValue(i.dueDate)) * 5), 0)
                )}
              </span>
              <p className="text-xs font-bold text-slate-400 mt-2">বিলম্ব সময়ের ভিত্তিতে পুঞ্জীভূত ৫৳/দিন পেনাল্টি</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-xs flex items-center space-x-3 bg-indigo-50/20 border-indigo-100/30">
              <ShieldAlert className="w-10 h-10 text-indigo-500 shrink-0" />
              <div>
                <span className="text-xs font-black text-indigo-900 block font-sans">রিটার্ন ও স্টক অটো-রিফ্রেশ ট্রিগার</span>
                <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
                  বই ফেরত গ্রহণ সফল সাপেক্ষে সিস্টেম অটোমেটিকভাবে ইনভেন্টরি স্টক বৃদ্ধি করবে এবং বিলম্ব জরিমানা সরাসরি নগদ রসিদ বা অ্যাকাউন্টে জমা করার ব্যবস্থা করবে।
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            {/* Search filter for penalty */}
            <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ওভারডিউ শিক্ষার্থী বা বইয়ের নাম খুঁজুন..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <button 
                onClick={loadData}
                disabled={loading}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-450 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-8 py-5">মেম্বার ও আইডি</th>
                      <th className="px-8 py-5">বইয়ের শিরোনাম</th>
                      <th className="px-8 py-5">ধার নেওয়ার তারিখ</th>
                      <th className="px-8 py-5">নির্ধারিত শেষ সময়</th>
                      <th className="px-8 py-5">বিলম্ব দিন ও জরিমানা</th>
                      <th className="px-8 py-5 text-right print:hidden">পদক্ষেপ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {issues
                      .filter(i => {
                        const rem = getDaysRemainingValue(i.dueDate);
                        const isOver = (i.status === 'Active' || i.status === 'Overdue') && rem < 0;
                        if (!isOver) return false;
                        const term = searchTerm.toLowerCase();
                        return i.memberName.toLowerCase().includes(term) || i.bookTitle.toLowerCase().includes(term);
                      })
                      .map((issue) => {
                        const daysRemaining = getDaysRemainingValue(issue.dueDate);
                        const elapsedDays = Math.abs(daysRemaining);
                        const calculatedFine = elapsedDays * 5;

                        return (
                          <tr key={issue.id} className="hover:bg-slate-50/40 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-3">
                                <span className="w-10 h-10 bg-rose-50 p-1 rounded-xl text-xs font-black text-rose-600 border border-rose-100 flex items-center justify-center">
                                  {issue.memberName.charAt(0)}
                                </span>
                                <div>
                                  <p className="font-black text-slate-900 group-hover:text-rose-600 transition-colors">{issue.memberName}</p>
                                  <span className="text-[10px] font-bold text-slate-400">ID: {issue.memberId || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="font-bold text-slate-700">{issue.bookTitle}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 font-bold text-slate-500">{toBengaliNumber(issue.issueDate)}</td>
                            <td className="px-8 py-6 font-black text-red-650">{toBengaliNumber(issue.dueDate)}</td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col space-y-0.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 border border-rose-100 text-rose-600 w-fit">
                                  {toBengaliNumber(elapsedDays)} দিন অতিবাহিত
                                </span>
                                <span className="text-[11px] text-red-600 font-extrabold block">
                                  জরিমানা: ৳{toBengaliNumber(calculatedFine)}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right print:hidden">
                              <div className="flex items-center justify-end gap-2.5">
                                <button 
                                  onClick={() => handleConfirmCollectedReturn(issue, calculatedFine, elapsedDays)}
                                  disabled={isProcessingCollection}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1 shadow-md shadow-emerald-100 cursor-pointer"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  <span>সফল ফেরত সংগ্রহ</span>
                                </button>
                                <button 
                                  onClick={() => handleWaiveOrResolveFineDirectly(issue, calculatedFine)}
                                  disabled={isProcessingCollection}
                                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <span>জরিমানা মওকুফ</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {issues.filter(i => {
                      const rem = getDaysRemainingValue(i.dueDate);
                      const isOver = (i.status === 'Active' || i.status === 'Overdue') && rem < 0;
                      if (!isOver) return false;
                      const term = searchTerm.toLowerCase();
                      return i.memberName.toLowerCase().includes(term) || i.bookTitle.toLowerCase().includes(term);
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4 animate-bounce" />
                          <p className="text-slate-500 font-extrabold text-sm">কোনো পেনাল্টি ওভারডিউ নেই!</p>
                          <p className="text-xs text-slate-400 font-medium mt-1">সব ধারকৃত বইয়ের সময়সীমা অনুকূলে রয়েছে।</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collect Dues Modal with Advanced Selected Date Picker */}
      {isCollectModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">✓</div>
                <h3 className="text-lg font-black text-slate-950">বকেয়া সংগ্রহের রসিদ</h3>
              </div>
              <button 
                onClick={() => setIsCollectModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectDuesSubmit} className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2.5xl space-y-2.5 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">বকেয়া পরিশোধকারী: <strong className="text-slate-900 font-black">{selectedMember.name}</strong></p>
                <p className="text-xs font-bold text-slate-500">মেম্বার আইডি: <strong className="text-slate-800 font-mono font-black">ECO-{selectedMember.id.padStart(4, '0')}</strong></p>
                <p className="text-xs font-bold text-slate-500">বর্তমান মোট বকেয়া: <strong className="text-rose-600 font-black">৳{selectedMember.dues}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">সংগৃহীত টাকার পরিমাণ (৳)</label>
                <input 
                  type="number"
                  required
                  min={1}
                  max={parseInt(String(selectedMember.dues).replace(/[^0-9]/g, '')) || 9999}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-emerald-500 focus:bg-white rounded-2xl text-base font-black focus:outline-none transition-all"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                />
              </div>

              {/* Advanced Calendar Date Selector implemented here */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">টাকা আদায়ের প্রকৃত তারিখ (Validation Date)</label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 focus:outline-none transition-all font-sans"
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-2 text-[10px] text-slate-450 font-bold leading-relaxed">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>টাকা আদায় সম্পন্ন করলে বকেয়ার পরিমাণ কমে যাবে এবং লাইভ ক্যাশবুকে নির্ধারিত "টাকা আদায়ের তারিখে" আয় হিসেবে জমা দেখানো হবে।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
                  disabled={isSavingCollection}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                  disabled={isSavingCollection}
                >
                  {isSavingCollection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>আদায় হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আদায় নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Charge Due Modal with Advanced Calendar selector */}
      {isChargeModalOpen && chargeMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold font-sans">+</div>
                <h3 className="text-lg font-black text-slate-950">নতুন বকেয়া চার্জ যোগ</h3>
              </div>
              <button 
                onClick={() => {
                  setIsChargeModalOpen(false);
                  setChargeMember(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChargeDueSubmit} className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2.5xl space-y-2 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">বকেয়া গ্রহীতা: <strong className="text-slate-900 font-black">{chargeMember.name}</strong></p>
                <p className="text-xs font-bold text-slate-500">মেম্বার আইডি: <strong className="text-slate-850 font-mono font-black">ECO-{chargeMember.id.padStart(4, '0')}</strong></p>
                <p className="text-xs font-bold text-slate-500">বর্তমান মোট বকেয়া: <strong className="text-rose-600 font-black">৳{chargeMember.dues}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জ পরিমাণ (৳)</label>
                <input 
                  type="number"
                  required
                  min={1}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-rose-500 focus:bg-white rounded-2xl text-base font-black focus:outline-none transition-all"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জের কারণ (Reason/Category)</label>
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all"
                  value={chargeReason}
                  onChange={(e) => setChargeReason(e.target.value)}
                >
                  <option value="বাৎসরিক মেম্বারশিপ বকেয়া ফি">বাৎসরিক মেম্বারশিপ বকেয়া ফি (৳৫০)</option>
                  <option value="বই ফেরত প্রদানের বিলম্ব জরিমানা">বই ফেরত প্রদানের বিলম্ব জরিমানা</option>
                  <option value="বইয়ের ক্ষতিপূরণ ফি">বইয়ের ক্ষতিপূরণ ফি</option>
                  <option value="অন্যান্য সেবামূলক বকেয়া">অন্যান্য সেবামূলক বকেয়া</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">চার্জের তারিখ (Charge Calendar Date)</label>
                <input 
                  type="date"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-250 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all font-sans"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsChargeModalOpen(false);
                    setChargeMember(null);
                  }}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
                  disabled={isSavingCharge}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-rose-600 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5"
                  disabled={isSavingCharge}
                >
                  {isSavingCharge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>রানিং...</span>
                    </>
                  ) : (
                    <span>চার্জ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Printable Report Dialog Center */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-6 h-6 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-xl font-black text-slate-900">পাঠাগার বকেয়া ফিল্ড রিপোর্ট প্রিন্ট সেন্টার</h3>
                  <p className="text-[10px] font-bold text-slate-400">মেম্বারদের মাসিক ফি ও পেন্ডিং পাওনার অফিশিয়াল তালিকা</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser security notice for sandbox environment */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs font-bold text-amber-900 space-y-1 print:hidden mb-6">
              <p className="font-black">📌 ব্রাউজার সিকিউরিটি নোটিশ (Iframe Security Warning):</p>
              <p className="leading-relaxed text-[11px] opacity-90">
                আপনি বর্তমানে এআই স্টুডিওর স্যান্ডবক্স আইফ্রেমের (Iframe) ভেতরে আছেন। ব্রাউজার সিকিউরিটির নিয়মানুযায়ী আইফ্রেম থেকে সরাসরি "প্রিন্ট" বাটন ব্লক হতে পারে। প্রিন্ট সঠিক না হলে দয়া করে উপরের অ্যাড্রেস বার সংলগ্ন <strong className="text-indigo-750 border-b border-indigo-300">"Open in New Tab" / "নতুন ট্যাবে খুলুন"</strong> বাটনে ক্লিক করে মূল ওয়েবসাইটে প্রবেশ করুন এবং ওখান থেকে এক ক্লিকে সম্পূর্ণ রিপোর্টটি পিডিএফ বা পেপারে প্রিন্ট করে নিন।
              </p>
            </div>

            {/* The Print Layout Frame representing exactly what will be printed */}
            <div id="printable-area-for-dues" className="bg-slate-50 p-6 sm:p-10 rounded-[24px] border border-slate-200 text-left overflow-x-auto min-h-[400px]">
              <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 sm:p-12 shadow-md rounded-[16px] border border-slate-100">
                {/* Letterhead */}
                <div className="text-center pb-6 border-b-2 border-indigo-600 space-y-1">
                  <h1 className="text-3xl font-black text-slate-900">অর্থনীতি উন্মুক্ত পাঠাগার</h1>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Department of Economics, MBSTU</p>
                  <p className="text-[11px] text-slate-450 font-bold">মাস্টারদা সূর্যসেন হল রোড, টাঙ্গাইল, বাংলাদেশ।</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <p>রিপোর্ট টাইপ: <strong className="text-slate-950 font-extrabold">সদস্যদের বাৎসরিক ফি ও বকেয়া তালিকা</strong></p>
                    <p>তারিখ: <strong className="text-slate-950 font-semibold font-mono">{new Date().toLocaleDateString('bn-BD')}</strong></p>
                  </div>
                  <div className="sm:text-right space-y-1">
                    <p>মোট বকেয়া যুক্ত সদস্য: <strong className="text-slate-950">{allMembers.filter(m => (parseInt(String(m.dues || '0').replace(/[^0-9]/g, '')) || 0) > 0).length} জন</strong></p>
                    <p>মোট বকেয়ার পরিমাণ: <strong className="text-rose-600 font-black">৳ {totalDuesOfAll}</strong></p>
                  </div>
                </div>

                {/* Printable Table */}
                <table className="w-full text-xs text-left border-collapse border border-slate-200 mt-6">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-800 border-b border-slate-205">
                      <th className="p-2 border border-slate-200">সদস্য আইডি ও নাম</th>
                      <th className="p-2 border border-slate-200" style={{ minWidth: '150px' }}>যোগদান ও মেয়াদের অবস্থা (মাস)</th>
                      <th className="p-2 border border-slate-200 text-right">বাৎসরিক ফি (৳)</th>
                      <th className="p-2 border border-slate-200 text-right">অন্যান্য বকেয়া (৳)</th>
                      <th className="p-2 border border-slate-200 text-right" style={{ minWidth: '80px' }}>মোট বকেয়া (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.map((member) => {
                      const mDues = parseInt(String(member.dues || '0').replace(/[^0-9]/g, '')) || 0;
                      const yearlyFee = calculateYearlyFeesOwedOnly(member);
                      const baseDue = member.baseDues ?? 0;
                      
                      const baseDateStr = member.validationStartDate || (member.joinDate ? member.joinDate.split('|')[0] : '');
                      const baseDate = baseDateStr ? parseAnyDate(baseDateStr) : null;
                      const today = new Date();

                      let dateBreakdownText = '';
                      if (baseDate) {
                        const mDiff = getMonthsBetween(baseDate, today);
                        const isPaid = member.yearlyFeeStatus === 'paid';
                        if (isPaid) {
                          dateBreakdownText = `${baseDateStr} (মেয়াদ: ${member.paidUntilDate || 'N/A'})`;
                        } else {
                          dateBreakdownText = `${baseDateStr} (${mDiff} মাস অতিবাহিত, অপ্রদত্ত)`;
                        }
                      } else {
                        dateBreakdownText = member.joinDate ? member.joinDate.split('|')[0] : 'N/A';
                      }

                      return (
                        <tr key={member.id} className="border-b border-slate-150 odd:bg-slate-50/50">
                          <td className="p-2 border border-slate-200">
                            <span className="font-mono font-bold block text-slate-700">ECO-{member.id.padStart(4, '0')}</span>
                            <span className="font-extrabold text-slate-900 text-[11px] block">{member.name}</span>
                          </td>
                          <td className="p-2 border border-slate-200 text-[10px] font-bold text-slate-500 leading-tight">
                            {dateBreakdownText}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold font-mono text-slate-700">
                            ৳{yearlyFee}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold font-mono text-slate-500">
                            ৳{baseDue}
                          </td>
                          <td className={`p-2 border border-slate-200 text-right font-black font-mono text-sm ${mDues > 0 ? "text-rose-600 bg-rose-50/20" : "text-emerald-600"}`}>
                            ৳{mDues}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer section */}
                <div className="pt-20 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <div className="text-center w-36">
                    <div className="border-t border-slate-300 pt-1">নিরীক্ষক স্বাক্ষর</div>
                  </div>
                  <div className="text-center w-36">
                    <div className="border-t border-slate-305 border-slate-300 pt-1">প্রধান অ্যাডমিন স্বাক্ষর</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Actions inside print modal */}
            <div className="flex justify-end space-x-3 mt-6 print:hidden">
              <button 
                type="button" 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
              <button 
                type="button" 
                onClick={handleTriggerPrint}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>রিপোর্ট প্রিন্ট করুন / PDF ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
