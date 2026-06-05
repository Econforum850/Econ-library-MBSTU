import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, 
  Search, Filter, RefreshCw, Loader2,
  BookOpen, User as UserIcon, ArrowRight,
  Plus, X, Calendar, CheckSquare, Bookmark, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseIssue as SheetIssue, SupabaseBook, SupabaseMember } from '@/src/lib/supabaseDatabase';

export default function AdminIssues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [books, setBooks] = useState<SupabaseBook[]>([]);
  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history'>('active');
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Modal / Form States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customBookTitle, setCustomBookTitle] = useState('');
  const [customMemberName, setCustomMemberName] = useState('');
  const [issueDate, setIssueDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const yyyy = twoWeeks.getFullYear();
    const mm = String(twoWeeks.getMonth() + 1).padStart(2, '0');
    const dd = String(twoWeeks.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const formatDateToSlash = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  // Borrow Approval States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingIssue, setApprovingIssue] = useState<SheetIssue | null>(null);
  const [approvePickupDate, setApprovePickupDate] = useState('');
  const [approveDueDate, setApproveDueDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch Issues
      const fetchedIssues = await db.getIssues();
      setIssues(fetchedIssues);
      
      // Fetch Books & Members for Modal dropdowns
      const fetchedBooks = await db.getBooks();
      setBooks(fetchedBooks.filter(b => !b.isEBook)); // only physical books can be issued
      
      const fetchedMembers = await db.getMembers();
      setMembers(fetchedMembers.filter(m => m.status === 'accepted' || m.status === 'active'));

      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Issues data pre-load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set default dates
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setIssueDate(`${yyyy}-${mm}-${dd}`);

    const dynamicDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dYyyy = dynamicDue.getFullYear();
    const dMm = String(dynamicDue.getMonth() + 1).padStart(2, '0');
    const dDd = String(dynamicDue.getDate()).padStart(2, '0');
    setDueDate(`${dYyyy}-${dMm}-${dDd}`);
  }, []);

  const handleOpenIssueModal = () => {
    setSelectedBookId('');
    setSelectedMemberId('');
    setCustomBookTitle('');
    setCustomMemberName('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setIssueDate(`${yyyy}-${mm}-${dd}`);

    const dynamicDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dYyyy = dynamicDue.getFullYear();
    const dMm = String(dynamicDue.getMonth() + 1).padStart(2, '0');
    const dDd = String(dynamicDue.getDate()).padStart(2, '0');
    setDueDate(`${dYyyy}-${dMm}-${dDd}`);
    setIsIssueModalOpen(true);
  };

  const handleCreateIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine book title and member name
    let bookTitle = customBookTitle;
    let memberName = customMemberName;
    let targetBook: SupabaseBook | undefined;

    if (selectedBookId) {
      targetBook = books.find(b => b.id === selectedBookId);
      if (targetBook) {
        bookTitle = targetBook.title;
      }
    }

    if (selectedMemberId) {
      const targetMember = members.find(m => m.id === selectedMemberId);
      if (targetMember) {
        memberName = `${targetMember.name} (#${targetMember.id})`;
      }
    }

    if (!bookTitle || !memberName) {
      alert('দয়া করে বই এবং সদস্য নির্বাচন করুন অথবা নাম লিখুন!');
      return;
    }

    try {
      setIsSavingIssue(true);

      // Save issue in database
      const newIssue: Partial<SheetIssue> = {
        bookTitle,
        memberName,
        issueDate: formatDateToSlash(issueDate) || new Date().toLocaleDateString('bn-BD'),
        dueDate: formatDateToSlash(dueDate) || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD'),
        status: 'Active',
        memberId: selectedMemberId || undefined,
        bookId: selectedBookId || undefined
      };

      await db.saveIssue(newIssue);

      // Interconnect: Automatically increment the issued copies of the selected book
      if (targetBook) {
        const total = targetBook.totalCopies !== undefined ? Number(targetBook.totalCopies) : targetBook.stock;
        const currentIssued = targetBook.issuedCopies !== undefined ? Number(targetBook.issuedCopies) : 0;
        const updatedBook = {
          ...targetBook,
          totalCopies: total,
          issuedCopies: currentIssued + 1
        };
        await db.saveBook(updatedBook);
      }

      try {
        await db.addAuditLog('ISSUE_BOOK', `বই ইস্যু করা হয়েছে: ${bookTitle} -> সদস্য: ${memberName}`);
      } catch (_) {}

      alert('বইটি সফলভাবে ইস্যু করা হয়েছে এবং বইয়ের স্টক আপডেট করা হয়েছে!');
      setIsIssueModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error creating issue loan:', err);
      alert('বই ইস্যু সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsSavingIssue(false);
    }
  };

  const parseSlashedDate = (slashDateStr: string): Date | null => {
    if (!slashDateStr) return null;
    const parts = slashDateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const dashes = slashDateStr.split('-');
    if (dashes.length === 3) {
      const year = parseInt(dashes[0], 10);
      const month = parseInt(dashes[1], 10) - 1;
      const day = parseInt(dashes[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  const handleReturnIssue = async (issue: SheetIssue) => {
    // Determine fine first
    const currentDueDate = parseSlashedDate(issue.dueDate);
    let fineAmount = 0;
    let daysLate = 0;
    if (currentDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentDueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - currentDueDate.getTime();
      if (diffTime > 0) {
        daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = daysLate * 5; // ৳৫ per day fine
      }
    }

    let confirmMsg = `আপনি কি নিশ্চিত যে "${issue.bookTitle}" বইটি ফেরত নিতে চান?`;
    if (fineAmount > 0) {
      confirmMsg = `বইটি ফেরত নিতে ${daysLate} দিন বিলম্ব হয়েছে! বিলম্ব জরিমানা বাবদ মোট ৳${fineAmount} সদস্যের বকেয়াতে যোগ করা হবে। আপনি কি নিশ্চিত?`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      // Mark issue as Returned
      const updatedIssue: SheetIssue = {
        ...issue,
        status: 'Returned'
      };
      await db.saveIssue(updatedIssue);

      // Interconnect: Automatically decrement issued copies of the book if found by title
      const matchedBook = books.find(b => b.title.toLowerCase() === issue.bookTitle.toLowerCase() || b.id === issue.bookId);
      if (matchedBook) {
        const currentIssued = matchedBook.issuedCopies !== undefined ? Number(matchedBook.issuedCopies) : 0;
        const updatedBook = {
          ...matchedBook,
          issuedCopies: Math.max(0, currentIssued - 1)
        };
        await db.saveBook(updatedBook);
      }

      // Add fine to member dues
      let resolvedMember = members.find(m => m.id === issue.memberId || m.name.includes(issue.memberName.split(' (#')[0]));
      if (resolvedMember && fineAmount > 0) {
        const updatedMember = {
          ...resolvedMember,
          dues: (resolvedMember.dues || 0) + fineAmount
        };
        await db.saveMember(updatedMember);
        try {
          await db.addAuditLog('BOOK_RETURN_FINE', `বিলম্ব জরিমানা ও বকেয়া যোগ: ৳${fineAmount} -> সদস্য: ${updatedMember.name} (বই: ${issue.bookTitle}, ${daysLate} দিন বিলম্ব)`);
        } catch (_) {}
      }

      try {
        await db.addAuditLog('RETURN_BOOK', `বই ফেরত নেওয়া হয়েছে: ${issue.bookTitle} -> সদস্য: ${issue.memberName} ${fineAmount > 0 ? `(জরিমানা: ৳${fineAmount})` : ''}`);
      } catch (_) {}

      // Dispatch Email Confirmation using user's configured eco24034@mbstu.ac.bd
      const recipientEmail = resolvedMember?.email;
      if (recipientEmail) {
        const emailSubject = `সফল রিটার্ন সম্পন্ন: ${issue.bookTitle} - MBSTU Econ Library`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
              <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
            </div>
            <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
              <p style="font-size: 16px; font-weight: bold;">প্রিয় ${resolvedMember.name},</p>
              <p>আপনার ইস্যুকৃত বইটি লাইব্রেরিতে সফলভাবে ফেরত নেওয়া হয়েছে।</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #10b981; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">রিটার্ন বিবরণী:</p>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">বইয়ের নাম:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${issue.bookTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">ফেরত প্রদানের তারিখ:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${new Date().toLocaleDateString('bn-BD')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">ফেরতের শেষ তারিখ:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${issue.dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">বিলম্বিত সময়:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${daysLate > 0 ? `${daysLate} দিন` : '০ দিন (বিলম্ব হয়নি)'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">বিলম্ব জরিমানা:</td>
                    <td style="padding: 6px 0; color: ${fineAmount > 0 ? '#ef4444' : '#10b981'}; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">${fineAmount > 0 ? `৳${fineAmount} (বকেয়াতে যুক্ত)` : '৳০ (কোনো জরিমানা নেই)'}</td>
                  </tr>
                </table>
              </div>
              <p>লাইব্রেরি ব্যবহারের জন্য ধন্যবাদ! পরবর্তী বই ধারের আবেদন দেখতে যেকোনো সময় আমাদের ওয়েবসাইট ব্রাউজ করুন।</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
            </div>
          </div>
        `;

        try {
          const data = await db.sendEmailWithLog({
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
            type: 'RETURN_RECEIPT'
          });
          if (!data.success) {
            console.warn('Email return fail:', data);
            alert(`বইটি লাইব্রেরিতে ফেরত নেওয়া হয়েছে!\n\n⚠️ তবে শিক্ষার্থীকে রিটার্ন রশিদ ইমেইল পাঠানো যায়নি।\nকারণ: ${data.error || 'SMTP Connection Error'}`);
          }
        } catch (err: any) {
          console.warn('Email return network fail:', err);
        }
      }

      alert('বইটি সফলভাবে ফেরত নেওয়া হয়েছে এবং ষ্টক ও জরিমানা আপডেট করা হয়েছে!');
      await loadData();
    } catch (err) {
      console.error('Error returning book issue:', err);
      alert('বই ফেরত সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveModal = (issue: SheetIssue) => {
    setApprovingIssue(issue);
    // Suggest 3 days later for collection by default
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dateFormatted = `${futureDate.toLocaleDateString('bn-BD')} সকাল ১০:০০ টা - দুপুর ৩:০০ টার মধ্যে`;
    setApprovePickupDate(dateFormatted);
    
    // Set typical due date (14 days from collection)
    const dueCalendarDate = new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const yyyy = dueCalendarDate.getFullYear();
    const mm = String(dueCalendarDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueCalendarDate.getDate()).padStart(2, '0');
    setApproveDueDate(`${yyyy}-${mm}-${dd}`);
    setIsApproveModalOpen(true);
  };

  const handleApproveBorrowRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingIssue) return;
    try {
      setLoading(true);
      
      const matchedBook = books.find(b => b.title.toLowerCase() === approvingIssue.bookTitle.toLowerCase() || b.id === approvingIssue.bookId);

      // Decrement book stock if available
      if (matchedBook) {
        if (matchedBook.stock <= 0) {
          alert('দুঃখিত, এই বইয়ের কোন স্টক ফাঁকা নেই!');
          return;
        }
        const updatedBook = {
          ...matchedBook,
          stock: Math.max(0, matchedBook.stock - 1),
          status: (matchedBook.stock - 1 <= 0) ? 'pre-order' as const : 'available' as const
        };
        await db.saveBook(updatedBook);
      }

      // Update issue loan parameters
      const updatedIssue: SheetIssue = {
        ...approvingIssue,
        status: 'Active',
        pickupDate: approvePickupDate,
        dueDate: formatDateToSlash(approveDueDate) || approvingIssue.dueDate,
        issueDate: new Date().toLocaleDateString('bn-BD')
      };
      
      await db.saveIssue(updatedIssue);
      try {
        await db.addAuditLog('APPROVE_BORROW_REQUEST', `ধারের আবেদন অনুমোদিত: ${approvingIssue.bookTitle} -> সদস্য: ${approvingIssue.memberName}`);
      } catch (_) {}

      // Dispatch Email Confirmation using user's configured eco24034@mbstu.ac.bd
      const resolvedMember = members.find(m => m.id === approvingIssue.memberId || m.name.includes(approvingIssue.memberName.split(' (#')[0]));
      const recipientEmail = resolvedMember?.email;
      if (recipientEmail) {
        const emailSubject = `বই ধার অনুমোদন নোটিশ - MBSTU Econ Library`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
            </div>
            <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
              <p style="font-size: 16px; font-weight: bold;">প্রিয় ${resolvedMember.name},</p>
              <p>আপনার বই ধার নেওয়ার আবেদনটি সফলভাবে অনুমোদন করা হয়েছে। বইটি সংগ্রহের সময় এবং শেষ ফেরতের তারিখ নিচে উল্লেখ করা হলো:</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #4f46e5; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">সরাসরি সংগ্রহ বিবরণী:</p>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">বইয়ের নাম:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${approvingIssue.bookTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">সংগ্রহের সময় (Pickup):</td>
                    <td style="padding: 6px 0; color: #4f46e5; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">${approvePickupDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">ফেরতের তারিখ (Due Date):</td>
                    <td style="padding: 6px 0; color: #ef4444; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${formatDateToSlash(approveDueDate) || approvingIssue.dueDate}</td>
                  </tr>
                </table>
              </div>
              <p>দয়া করে আপনার ডিজিটাল মেম্বার লাইব্রেরি কার্ডটি সাথে রাখুন। বিভাগে গিয়ে দায়িত্বপ্রাপ্ত কর্মকর্তার কাছে কার্ডের কিউআর কোড স্ক্যান করে বইটি সংগ্রহ করুন।</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p>&copy; ${new Date().getFullYear()} Department of Economics, MBSTU. All Rights Reserved.</p>
            </div>
          </div>
        `;

        try {
          const data = await db.sendEmailWithLog({
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
            type: 'BORROW_APPROVAL'
          });
          if (!data.success) {
            console.warn('Email borrow approval mail fail:', data);
            alert(`ধারের আবেদনটি অনুমোদিত হয়েছে!\n\n⚠️ তবে বই ধারের অনুমোদন নিশ্চিতকরণ ইমেইল পাঠানো যায়নি।\nকারণ: ${data.error || 'SMTP Connection Error'}`);
          }
        } catch (err: any) {
          console.warn('Email borrow approval network fail:', err);
        }
      }

      alert('ধার নেওয়ার আবেদনটি সফলভাবে অনুমোদিত হয়েছে এবং সংগ্রহের সময় নির্ধারণ করা হয়েছে!');
      setIsApproveModalOpen(false);
      setApprovingIssue(null);
      await loadData();
    } catch (err) {
      console.error('Approving borrow request failed:', err);
      alert('আবেদন অনুমোদনে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBorrowRequest = async (issue: SheetIssue) => {
    if (!window.confirm(`আপনি কি সত্যিই "${issue.bookTitle}" বইটির ধারের আবেদন বাতিল করতে চান?`)) {
      return;
    }
    try {
      setLoading(true);
      const updatedIssue: SheetIssue = {
        ...issue,
        status: 'Rejected'
      };
      await db.saveIssue(updatedIssue);
      try {
        await db.addAuditLog('REJECT_BORROW_REQUEST', `ধারের আবেদন বাতিল/নাকচ: ${issue.bookTitle} -> সদস্য: ${issue.memberName}`);
      } catch (_) {}
      alert('আবেদনটি বাতিল ও প্রত্যাখ্যাত করা হয়েছে।');
      await loadData();
    } catch (err) {
      console.error('Rejecting request failed:', err);
      alert('আবেদন বাতিলে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Status-based Tab filtering
  const tabFilteredIssues = issues.filter(i => {
    if (activeTab === 'active') {
      return i.status === 'Active' || i.status === 'Overdue';
    }
    if (activeTab === 'pending') {
      return i.status === 'Pending';
    }
    return i.status === 'Returned' || i.status === 'Rejected';
  });

  const filteredIssues = tabFilteredIssues.filter(i => 
    i.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">বই ইস্যু ও ফেরত (Issues)</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {issues.length} টি রেকর্ড সংরক্ষিত</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ ডেটাবেইজ
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleOpenIssueModal}
            className="flex items-center space-x-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <span>নতুন বই ইস্যু করুন</span>
          </button>
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs Filter Section */}
      <div className="flex border-b border-slate-100 max-w-md bg-slate-50 p-1.5 rounded-[22px] border">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all",
            activeTab === 'active' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          সক্রিয় লোন ({issues.filter(i => i.status === 'Active' || i.status === 'Overdue').length})
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all relative",
            activeTab === 'pending' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          আবেদনসমূহ ({issues.filter(i => i.status === 'Pending').length})
          {issues.filter(i => i.status === 'Pending').length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 text-center text-xs font-black rounded-[18px] transition-all",
            activeTab === 'history' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-850"
          )}
        >
          ইতিহাস রেকর্ড ({issues.filter(i => i.status === 'Returned' || i.status === 'Rejected').length})
        </button>
      </div>

      {loading && issues.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
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
                  <th className="px-8 py-5">ইস্যু / আবেদনের তারিখ</th>
                  <th className="px-8 py-5">ফেরত / সংগ্রহের সময়</th>
                  <th className="px-8 py-5">স্ট্যাটাস</th>
                  <th className="px-8 py-5 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="font-black text-slate-900 line-clamp-1">{issue.bookTitle}</span>
                          {issue.notes && (
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5 line-clamp-1 italic">নোট: {issue.notes}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Link 
                        to={`/admin/users?search=${encodeURIComponent(issue.memberName.split(' ')[0])}`}
                        className="flex items-center space-x-3 group/link hover:text-indigo-600 transition-colors"
                      >
                        <UserIcon className="w-5 h-5 text-slate-400 group-hover/link:text-indigo-400" />
                        <span className="font-bold text-slate-600 group-hover/link:text-indigo-600">{issue.memberName}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-indigo-400" />
                      </Link>
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-bold">
                      {issue.issueDate}
                    </td>
                    <td className="px-8 py-6">
                      {issue.status === 'Pending' ? (
                        <span className="text-yellow-600 font-black text-xs">এডমিন নির্ধারণ করবে</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{issue.dueDate}</span>
                          {issue.pickupDate && (
                            <span className="text-[10px] text-indigo-600 font-black tracking-tight mt-0.5">সংগ্রহ: {issue.pickupDate}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                        issue.status === 'Active' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        issue.status === 'Pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        issue.status === 'Returned' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        {issue.status === 'Active' ? 'চলতি লোন' : 
                         issue.status === 'Pending' ? 'আবেদন পেন্ডিং' :
                         issue.status === 'Returned' ? 'ফেরত প্রাপ্ত' : 'বাতিল / প্রত্যাখ্যাত'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {issue.status === 'Pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenApproveModal(issue)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 duration-150"
                          >
                            অনুমোদন ও শিডিউল
                          </button>
                          <button 
                            onClick={() => handleRejectBorrowRequest(issue)}
                            className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : issue.status === 'Active' || issue.status === 'Overdue' ? (
                        <button 
                          onClick={() => handleReturnIssue(issue)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                        >
                          ফেরত নিন
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">নিষ্পত্তি সম্পূর্ণ</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                      <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-bold">এই ক্যাটাগরিতে কোন ইস্যু লোন বা আবেদন ডাটা পাওয়া যায়নি।</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Issue Loan Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">নতুন বই ইস্যু বা ধার দিন</h3>
              <button 
                onClick={() => setIsIssueModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-6 text-left">
              
              {/* Select book */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">লাইব্রেরি বই নির্বাচন করুন</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    if (e.target.value === '') setCustomBookTitle('');
                  }}
                >
                  <option value="">-- বই সিলেক্ট করুন --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                      {b.title} (ID: {b.bookId}) - ষ্টক: {b.stock} কপি {b.stock <= 0 ? '[ষ্টক শেষ]' : ''}
                    </option>
                  ))}
                </select>
                
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">অথবা বইয়ের নাম লিখুন</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <input 
                  type="text"
                  placeholder="বইয়ের নাম (সিলেক্ট না করলে কার্যকর)"
                  disabled={!!selectedBookId}
                  className="mt-3 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                  value={customBookTitle}
                  onChange={(e) => setCustomBookTitle(e.target.value)}
                />
              </div>

              {/* Select Member */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">সক্রিয় সদস্য নির্বাচন করুন</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (e.target.value === '') setCustomMemberName('');
                  }}
                >
                  <option value="">-- সক্রিয় সদস্য সিলেক্ট করুন --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: {m.id})
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">অথবা সদস্যের নাম লিখুন</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <input 
                  type="text"
                  placeholder="সদস্যের নাম (সিলেক্ট না করলে কার্যকর)"
                  disabled={!!selectedMemberId}
                  className="mt-3 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                  value={customMemberName}
                  onChange={(e) => setCustomMemberName(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ইস্যু তারিখ</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 font-sans"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেরতের শেষ সময়</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 font-sans"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3 text-[10px] font-semibold text-slate-400 leading-relaxed">
                <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>বই লোন ইস্যু জমা করলে লাইব্রেরির বইয়ের ষ্টক রেজিস্ট্রি থেকে অটোজেনারেটেড ১টি কপি কমে যাবে। সদস্যের বিবরণী থেকে লোনের হিসাব পর্যবেক্ষণ করা সম্ভব হবে।</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl"
                  disabled={isSavingIssue}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  disabled={isSavingIssue}
                >
                  {isSavingIssue ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ইস্যু হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ইস্যু কনফার্ম করুন</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Approve and Schedule Borrow Request Modal */}
      {isApproveModalOpen && approvingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[45px] border border-slate-100 p-8 md:p-10 shadow-2xl max-w-lg w-full text-left">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-indigo-600" />
                <span>আবেদন অনুমোদন ও সময় নির্ধারণ</span>
              </h3>
              <button 
                onClick={() => { setIsApproveModalOpen(false); setApprovingIssue(null); }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveBorrowRequest} className="space-y-6">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-bold text-slate-600">
                <p className="text-indigo-900 text-sm mb-1 font-black">বই নাম: {approvingIssue.bookTitle}</p>
                <p>আবেদনকারী: {approvingIssue.memberName}</p>
                {approvingIssue.notes && <p className="mt-2 text-[10px] italic text-slate-400">মন্তব্য: {approvingIssue.notes}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">বই সংগ্রহের নির্দিষ্ট তারিখ ও সময়</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: ০৫ জুন, ২০২৬ দুপুর ১২:০০ টা বা আমাদের অফিস সময়ে"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={approvePickupDate}
                  onChange={(e) => setApprovePickupDate(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 font-bold mt-1.5">💡 এই সংগ্রহের সময়টি সদস্য তার প্রোফাইলের "বর্তমানের আবেদন" ট্যাব থেকে সরাসরি দেখতে পাবেন এবং মোবাইলে জিপিএস ট্র্যাকিং বা নির্দিষ্ট সময়ে বই সংগ্রহ করতে উপস্থিত হবেন।</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেরত দেওয়ার শেষ সময় (Due Date)</label>
                <input 
                  type="date"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 font-sans"
                  value={approveDueDate}
                  onChange={(e) => setApproveDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsApproveModalOpen(false); setApprovingIssue(null); }}
                  className="px-6 py-3.5 bg-slate-50 text-slate-500 font-bold rounded-xl"
                >
                  ক্যান্সেল
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-slate-900 transition-all"
                >
                  অনুমোদন দিন ও স্টক কমান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
