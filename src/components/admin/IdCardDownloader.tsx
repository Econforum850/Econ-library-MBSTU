import { useState, useEffect } from 'react';
import { Download, Loader2, ArrowRightLeft, CheckCircle2, ShieldAlert, Mail, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SupabaseMember } from '../../lib/supabaseDatabase';

interface IdCardDownloaderProps {
  member: SupabaseMember;
  onSuccess?: () => void;
}

export default function IdCardDownloader({ member, onSuccess }: IdCardDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Email state variables
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  // Backwards-compatible custom Issue Date and Expiry Date structure parsing
  const getDates = () => {
    if (member.joinDate && member.joinDate.includes('|')) {
      const parts = member.joinDate.split('|');
      return {
        issueDate: parts[0],
        expiryDate: parts[1]
      };
    }
    const issue = member.joinDate || new Date().toLocaleDateString('bn-BD');
    const calculateExpiry = (joinDateStr: string) => {
      try {
        const parts = joinDateStr.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[2]) + 4;
          return `${parts[0]}/${parts[1]}/${year}`;
        }
      } catch (e) {}
      const d = new Date();
      d.setFullYear(d.getFullYear() + 4);
      return d.toLocaleDateString('bn-BD');
    };
    return {
      issueDate: issue,
      expiryDate: calculateExpiry(issue)
    };
  };

  const { issueDate, expiryDate } = getDates();

  const qrPayload = JSON.stringify({
    cardId: `card-${member.id}`,
    memberNumber: `ECO-2026-${member.id.substring(member.id.length - 3).toUpperCase()}`,
    name: member.name,
    status: 'active'
  });

  const verificationUrl = `https://mbstu-econ.edu/verify?payload=${btoa(encodeURIComponent(qrPayload))}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationUrl)}`;

  useEffect(() => {
    // Convert QR Code URL to base64
    const loadQR = async () => {
      try {
        const base64 = await urlToBase64(qrImageUrl);
        setQrBase64(base64);
      } catch (err) {
        console.warn('QR Base64 convert fail:', err);
      }
    };

    // Convert Avatar Photo URL or Base64 data securely
    const loadAvatar = async () => {
      if (member.photo) {
        let photoUrl = member.photo;
        if (photoUrl.startsWith('/')) {
          photoUrl = window.location.origin + photoUrl;
        }

        if (photoUrl.startsWith('data:')) {
          setAvatarBase64(photoUrl);
        } else if (photoUrl.startsWith('http')) {
          try {
            // Avoid CORS by fetching via proxy if necessary, or simple convert
            const base64 = await urlToBase64(photoUrl);
            setAvatarBase64(base64);
          } catch (err) {
            console.warn('Avatar photo Base64 convert fail, using fallback:', err);
          }
        }
      }
    };

    loadQR();
    loadAvatar();
  }, [member.photo, qrImageUrl]);

  // Helper to convert images securely to Base64 in order to write into jsPDF cleanly
  const urlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas clear error'));
        }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  // Factorized standard PDF template builder
  const buildPdfObject = () => {
    // Card Dimensions in mm (CR-80 ISO: 85.6mm x 53.98mm)
    // Custom vertical standard size: 54mm width x 86mm height
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [54, 86]
    });

    // ==========================================
    // PAGE 1: FRONT OF THE MEMBERSHIP IDENTITY CARD
    // ==========================================

    // Background - deep professional theme
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(0, 0, 54, 86, 'F');

    // Accent top bar
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 54, 14, 'F');

    // Golden Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('DEPARTMENT OF ECONOMICS', 27, 4, { align: 'center' });
    doc.setFontSize(4);
    doc.setTextColor(199, 210, 254); // indigo 200
    doc.text('MBSTU UNIVERSITY AND LIBRARY', 27, 7, { align: 'center' });

    // Title
    doc.setFillColor(17, 24, 39); // slate 955 subheader
    doc.rect(0, 9, 54, 5, 'F');
    doc.setTextColor(253, 224, 71); // gold 300
    doc.setFontSize(4.5);
    doc.text('★ MEMBERSHIP IDENTITY CARD ★', 27, 12, { align: 'center' });

    // Portrait Image Frame
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.setFillColor(241, 245, 249);
    doc.rect(17, 18, 20, 20, 'FD'); // 20x20 picture box centered

    if (avatarBase64) {
      try {
        let format = 'JPEG';
        if (avatarBase64.startsWith('data:image/png') || avatarBase64.endsWith('.png')) {
          format = 'PNG';
        } else if (avatarBase64.startsWith('data:image/webp') || avatarBase64.endsWith('.webp')) {
          format = 'WEBP';
        } else if (avatarBase64.startsWith('data:image/gif') || avatarBase64.endsWith('.gif')) {
          format = 'GIF';
        }
        doc.addImage(avatarBase64, format, 17, 18, 20, 20);
      } catch (err) {
        console.error('Failed to add avatar image to PDF:', err);
        // Fallback user monogram letter if jsPDF image drawing failed
        doc.setFillColor(79, 70, 229);
        doc.rect(17, 18, 20, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(member.name.charAt(0).toUpperCase(), 27, 30, { align: 'center' });
      }
    } else {
      // Fallback user monogram letter
      doc.setFillColor(79, 70, 229);
      doc.rect(17, 18, 20, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(member.name.charAt(0).toUpperCase(), 27, 30, { align: 'center' });
    }

    // Member ID Badge
    doc.setFillColor(30, 41, 59); // slate 800
    doc.roundedRect(8, 41, 38, 5, 1, 1, 'F');
    doc.setTextColor(129, 140, 248); // indigo 400
    doc.setFontSize(4.5);
    doc.setFont('Helvetica', 'bold');
    const uniqueIdStr = `MEMBERSHIP ID: ECO-${member.id.padStart(4, '0')}`;
    doc.text(uniqueIdStr, 27, 44.5, { align: 'center' });

    // Core details layout
    doc.setTextColor(248, 250, 252);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(4);
    doc.text('NAME:', 6, 50);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5);
    doc.text(member.name.toUpperCase(), 18, 50);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(4);
    doc.text('ROLE:', 6, 54.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(member.role.toUpperCase(), 18, 54.5);

    doc.setFont('Helvetica', 'normal');
    doc.text('BLOOD GROUP:', 6, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text('B+', 18, 59); // default or matching status

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(248, 250, 252);
    doc.text('PHONE:', 6, 63.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(member.phone, 18, 63.5);

    // Timeline / Date stamps
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.15);
    doc.line(4, 67, 50, 67);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(3.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ISSUE DATE', 6, 71);
    doc.text('EXPIRY DATE', 34, 71);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255);
    doc.text(issueDate, 6, 75);
    doc.text(expiryDate, 34, 75);

    // Gold bottom chip decoration
    doc.setFillColor(234, 179, 8); // amber 500
    doc.rect(0, 84.5, 54, 1.5, 'F');


    // ==========================================
    // PAGE 2: REVERSE SIDE (TERMS & CRYPTOGRAPHIC QR)
    // ==========================================
    doc.addPage();

    doc.setFillColor(15, 23, 42); // slate 900 background
    doc.rect(0, 0, 54, 86, 'F');

    // Top headers
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 54, 8, 'F');
    doc.setTextColor(241, 245, 249);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('TERMS & CONDITIONS', 27, 5.5, { align: 'center' });

    // Rules text
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(3.2);
    doc.text('1. This digital identity card is non-transferable.', 5, 13);
    doc.text('2. Please present this card for scanning during book issues.', 5, 17);
    doc.text('3. In case of loss, contact the Economics Department Desk.', 5, 21);
    doc.text('4. This card remains the official property of MBSTU.', 5, 25);

    // QR Code container Box
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 30, 26, 26, 1.5, 1.5, 'FD');

    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', 15, 31, 24, 24);
    }

    // Scanner tag helper
    doc.setTextColor(129, 140, 248);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4);
    doc.text('[ SCAN QR FOR VALIDITY ]', 27, 60, { align: 'center' });

    // Bottom website
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.text('www.mbstu-econ.edu', 27, 64, { align: 'center' });

    // Signatures
    doc.line(12, 75, 42, 75);
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.text('AUTHORIZED SIGNATORY STAMP', 27, 79, { align: 'center' });

    // Gold bottom chip decoration
    doc.setFillColor(234, 179, 8); // amber 500
    doc.rect(0, 84.5, 54, 1.5, 'F');

    return doc;
  };

  // Generate downloadable dual-face print PDF card using jsPDF
  const handlePdfDownload = async () => {
    try {
      setDownloading(true);
      const doc = buildPdfObject();
      // Save PDF output file
      doc.save(`identity_card_${member.id.substring(0, 6).toUpperCase()}.pdf`);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('PDF Build failed:', error);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setDownloading(false);
    }
  };

  // Generate PDF first, convert to Base64, and send to student's email with attachment
  const handleSendEmailWithPdf = async () => {
    try {
      setSendingEmail(true);
      setEmailSendError(null);
      setEmailSentSuccess(false);

      const doc = buildPdfObject();
      const pdfDataUri = doc.output('datauristring');

      const emailSubject = 'আপনার ডিজিটাল লাইব্রেরি মেম্বারশিপ কার্ড ও আইডি তথ্য - MBSTU Econ Library';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">MBSTU Econ Library</h2>
            <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Econ Library & Organization</p>
          </div>
          
          <div style="margin-bottom: 30px; font-size: 15px; color: #334155; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: bold;">প্রিয় ${member.name},</p>
            <p>আপনার ডিজিটাল লাইব্রেরি মেম্বারশিপ কার্ড সফলভাবে ইস্যু করা হয়েছে এবং এই ইমেইলের সাথে <strong>পিডিএফ (PDF) ফাইল হিসেবে সংযুক্ত</strong> করা হলো।</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #4f46e5; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">আইডি তথ্য ও মেয়াদকাল:</p>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                   <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0; width: 45%;">সদস্য আইডি:</td>
                   <td style="padding: 6px 0; color: #0f172a; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">ECO-${member.id.padStart(4, '0')}</td>
                </tr>
                <tr>
                   <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">ইস্যুর তারিখ:</td>
                   <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${issueDate}</td>
                </tr>
                <tr>
                   <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">কার্ডের মেয়াদকাল:</td>
                   <td style="padding: 6px 0; color: #ef4444; font-weight: 800; border-bottom: 1px dashed #e2e8f0;">${expiryDate}</td>
                </tr>
                <tr>
                   <td style="padding: 6px 0; color: #64748b; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">সদস্যপদ রোল:</td>
                   <td style="padding: 6px 0; color: #0f172a; font-weight: bold; border-bottom: 1px dashed #e2e8f0;">${member.role}</td>
                </tr>
              </table>
            </div>
            
            <p>অনুগ্রহ করে সংযুক্ত মেম্বার কার্ডের পিডিএফ সংস্করণটি আপনার ফোনে সংরক্ষণ করুন অথবা প্রিন্ট করে নিন। লাইব্রেরিতে বই লোন বা ইস্যুর সময় এই কার্ডের কিউআর (QR) কোডটি স্ক্যান করা আবশ্যক।</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0 20px 0;">
            <a href="${window.location.origin}/login" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">লাইব্রেরি অ্যাকাউন্টে লগইন করুন</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p>এটি একটি অটোমেটেড মেইল। কোনো বিষয়ের জন্য সরাসরি এই ইমেইলে রিপ্লাই প্রদান করবেন না।</p>
            <p>&copy; ${new Date().getFullYear()} MBSTU Economics Department Library. All Rights Reserved.</p>
          </div>
        </div>
      `;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: member.email,
          subject: emailSubject,
          html: emailHtml,
          pdfAttachment: pdfDataUri
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailSentSuccess(true);
        setTimeout(() => setEmailSentSuccess(false), 8000);
      } else {
        throw new Error(data.error || 'Server SMTP fail');
      }
    } catch (err: any) {
      console.error('Core Attach SMTP dispatch fail:', err);
      setEmailSendError(err.message || 'ইমেইল পাঠাতে পি ডি এফ সংযুক্ত করার সময় সমস্যা হয়েছে।');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-[32px] p-6 border border-slate-800 shadow-xl w-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">ডিজিটাল মেম্বার আইডি কার্ড</h4>
          <p className="text-[10px] text-slate-400 font-bold">CR-80 ISO স্ট্যান্ডার্ড ডিজাইন</p>
        </div>
        <button
          onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 font-black text-[9px] rounded-lg border border-slate-700 uppercase"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>{activeSide === 'front' ? 'পেছনের দিক' : 'सामনের দিক'}</span>
        </button>
      </div>

      {/* Visual Live Vector Card Preview in HTML container */}
      <div className="flex justify-center my-6">
        <div 
          id="preview-card-container" 
          className="relative w-[280px] h-[440px] bg-slate-950 rounded-[28px] shadow-2xl border border-slate-800 overflow-hidden text-left flex flex-col justify-between"
        >
          {activeSide === 'front' ? (
            /* FRONT CARD PREVIEW */
            <>
              {/* Header block */}
              <div className="bg-indigo-600 text-center py-4 px-2 select-none">
                <h5 className="text-[9px] font-black tracking-wide text-white leading-none">DEPARTMENT OF ECONOMICS</h5>
                <p className="text-[7px] text-indigo-200 mt-1 uppercase font-bold leading-none">MBSTU University and Library</p>
                
                {/* Secondary strip */}
                <div className="bg-slate-950 mt-2 py-1 text-[8px] font-black text-yellow-400 uppercase tracking-widest text-center">
                  Membership Identity Card
                </div>
              </div>

              {/* Avatar Body section */}
              <div className="flex justify-center mt-2 px-6">
                <div className="w-24 h-24 bg-slate-850 rounded-[20px] overflow-hidden border-2 border-indigo-500 shadow-lg relative flex items-center justify-center">
                  {member.photo && member.photo !== "" ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-black">{member.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              {/* ID Identifier badge */}
              <div className="px-6 mt-1 text-center">
                <span className="inline-block px-3 py-1 bg-slate-850 text-indigo-400 font-black text-[9px] rounded-full border border-slate-800 tracking-wider">
                  MEMBER ID: ECO-{member.id.padStart(4, '0')}
                </span>
              </div>

              {/* Attributes fields list */}
              <div className="px-6 space-y-1.5 text-[9px]">
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-slate-500 font-extrabold uppercase shrink-0">Name:</span>
                  <span className="text-slate-200 font-mono font-black truncate">{member.name.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-extrabold uppercase shrink-0">Role:</span>
                  <span className="text-slate-300 font-bold">{member.role}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-extrabold uppercase shrink-0">Blood:</span>
                  <span className="text-rose-500 font-black">B+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-extrabold uppercase shrink-0">Phone:</span>
                  <span className="text-indigo-300 font-bold font-mono">{member.phone}</span>
                </div>
              </div>

              {/* Timelines block */}
              <div className="px-6 py-2 border-t border-slate-900 flex justify-between text-[8px] bg-slate-900/40">
                <div>
                  <span className="text-slate-500 font-extrabold text-[7px] block uppercase">Issue</span>
                  <span className="text-slate-300 font-bold">{issueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-extrabold text-[7px] block uppercase">Expiry</span>
                  <span className="text-rose-405 font-extrabold text-amber-300">{expiryDate}</span>
                </div>
              </div>

              {/* Bottom tag decoration */}
              <div className="h-1.5 bg-yellow-500 w-full" />
            </>
          ) : (
            /* BACK CARD PREVIEW */
            <>
              {/* Back header */}
              <div className="bg-slate-900 border-b border-indigo-950 text-center py-2">
                <span className="text-[8px] font-black tracking-widest text-slate-300 uppercase">Terms & Conditions</span>
              </div>

              {/* Rules lines */}
              <div className="px-6 space-y-1 text-[7px] text-slate-500 font-medium pt-2 leading-snug">
                <p>1. This digital ID card remains the sole property of MBSTU.</p>
                <p>2. Present this QR code on request to authenticate loans.</p>
                <p>3. Transferring or counterfeiting this credentials is strictly void.</p>
                <p>4. If found, please return to Economics Department Desk.</p>
              </div>

              {/* QR Image container block */}
              <div className="flex justify-center py-2">
                <div className="p-1.5 bg-white rounded-xl border border-indigo-500/40 shadow-md">
                  <img 
                    src={qrImageUrl} 
                    alt="QR Verification Link" 
                    className="w-20 h-20 bg-white"
                  />
                </div>
              </div>

              {/* Prompt sticker */}
              <div className="text-center font-black text-indigo-400 text-[8px] uppercase tracking-wide leading-none pb-1">
                [ Cryptographic Verification Active ]
              </div>

              <div className="text-center text-[7px] text-slate-400 hover:text-indigo-300 mt-1 font-mono transition-colors">
                www.mbstu-econ.edu
              </div>

              {/* Signature Line */}
              <div className="px-6 pb-2 pt-2 text-center">
                <div className="h-px bg-slate-800 mx-auto w-32" />
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mt-1">Authorized Department Stamp</span>
              </div>

              {/* Bottom tag decoration */}
              <div className="h-1.5 bg-yellow-500 w-full" />
            </>
          )}
        </div>
      </div>

      {/* Control panel buttons */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        {/* PDF Download Button */}
        <button
          onClick={handlePdfDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center space-x-2.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[16px] font-black text-xs shadow-lg shadow-indigo-500/5 transition-all active:scale-95 duration-150"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>পিডিএফ ফাইল স্লট হচ্ছে...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>আইডি কার্ড ডাউনলোড করুন (Print PDF)</span>
            </>
          )}
        </button>

        {/* Send PDF Attached via SMTP Email Button */}
        <button
          onClick={handleSendEmailWithPdf}
          disabled={sendingEmail || !qrBase64}
          className="w-full flex items-center justify-center space-x-2.5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-[16px] font-black text-xs shadow-lg shadow-emerald-500/5 transition-all active:scale-95 duration-150"
        >
          {sendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>কার্ড সহ ইমেইল পাঠানো হচ্ছে...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>ইমেইলে পিডিএফ কার্ডসহ পাঠান (Attached Mail)</span>
            </>
          )}
        </button>

        {/* Message dispatch statuses banner notifications */}
        {emailSentSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center space-x-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-450 shrink-0" />
            <span>সদস্যের ইমেইল ঠিকানায় সফলভাবে পিডিএফ আইডি কার্ড পাঠানো হয়েছে!</span>
          </div>
        )}

        {emailSendError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[11px] font-bold flex items-center space-x-2 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 text-rose-450 shrink-0" />
            <span className="truncate">{emailSendError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
