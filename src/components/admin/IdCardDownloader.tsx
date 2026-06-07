import { useState, useEffect } from 'react';
import { Download, Loader2, ArrowRightLeft, CheckCircle2, ShieldAlert, Mail, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SupabaseMember, db } from '../../lib/supabaseDatabase';

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
    if (member.membershipExpiry) {
      let expiryFormatted = member.membershipExpiry;
      if (expiryFormatted.includes('-')) {
        const parts = expiryFormatted.split('-');
        if (parts.length === 3) {
          expiryFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      let issue = member.joinDate || new Date().toLocaleDateString('bn-BD');
      if (issue.includes('|')) {
        issue = issue.split('|')[0];
      }
      return {
        issueDate: issue,
        expiryDate: expiryFormatted
      };
    }

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

    // Background - deep premium Navy Blue theme
    doc.setFillColor(8, 12, 30); // Deep dark space color
    doc.rect(0, 0, 54, 86, 'F');

    // Draw secure grid/mesh pattern to look extremely official & professional
    doc.setDrawColor(22, 28, 59); // faint slate-faint navy grid
    doc.setLineWidth(0.08);
    for (let i = 4; i < 86; i += 7) {
      doc.line(0, i, 54, i);
    }
    for (let j = 4; j < 54; j += 7) {
      doc.line(j, 0, j, 86);
    }

    // High quality diagonal biometric overlay lines (anti-counterfeit measure)
    doc.setDrawColor(30, 41, 75);
    doc.setLineWidth(0.12);
    doc.line(0, 20, 54, 55);
    doc.line(0, 45, 54, 80);

    // Accent top bar
    doc.setFillColor(23, 29, 64); // Dark Royal Indigo
    doc.rect(0, 0, 54, 15, 'F');

    // Deep gold accent line under top bar
    doc.setFillColor(217, 119, 6); // gold
    doc.rect(0, 15, 54, 0.6, 'F');

    // Golden Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.text('DEPARTMENT OF ECONOMICS', 27, 4.5, { align: 'center' });
    doc.setFontSize(3.6);
    doc.setTextColor(165, 180, 252); // indigo 300
    doc.text('MAWLANA BHASHANI SCIENCE & TECHNOLOGY UNIVERSITY', 27, 7.5, { align: 'center' });

    // Title Designation Strip
    doc.setFillColor(8, 11, 26); // absolute black
    doc.rect(0, 10, 54, 5, 'F');
    doc.setTextColor(251, 191, 36); // warm gold amber
    doc.setFontSize(4.3);
    doc.text('★ MEMBERSHIP IDENTITY CARD ★', 27, 13.5, { align: 'center' });

    // Microchip shape at top left of body (Simulates microchip RFID safety)
    doc.setFillColor(217, 119, 6); // Golden Amber
    doc.roundedRect(5, 19, 7.5, 5.8, 0.8, 0.8, 'F');
    doc.setDrawColor(146, 64, 14); // Dark bronze trace lines
    doc.setLineWidth(0.18);
    doc.roundedRect(5.5, 19.5, 6.5, 4.8, 0.5, 0.5, 'D');
    doc.line(8.75, 19, 8.75, 24.8);
    doc.line(5, 21.9, 12.5, 21.9);

    // Premium Double-bar and borders Avatar Portrait Frame (Centered)
    doc.setDrawColor(79, 70, 229); // outer border
    doc.setLineWidth(0.4);
    doc.setFillColor(15, 23, 42); // dark inner bg
    doc.roundedRect(17.5, 17, 19, 19, 3.2, 3.2, 'FD'); // centered avatar frame

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
        doc.addImage(avatarBase64, format, 18, 17.5, 18, 18);
      } catch (err) {
        console.error('Failed to add avatar image to PDF:', err);
        // Fallback user monogram letter if jsPDF image drawing failed
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(18, 17.5, 18, 18, 2.5, 2.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(member.name.charAt(0).toUpperCase(), 27, 29, { align: 'center' });
      }
    } else {
      // Fallback user monogram letter
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(18, 17.5, 18, 18, 2.5, 2.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(member.name.charAt(0).toUpperCase(), 27, 29, { align: 'center' });
    }

    // Member ID Badge (Pill Container)
    doc.setFillColor(17, 24, 39); // slate 900
    doc.roundedRect(10, 38.5, 34, 4.8, 1, 1, 'F');
    doc.setTextColor(165, 180, 252); // indigo 300
    doc.setFontSize(4.2);
    doc.setFont('Helvetica', 'bold');
    doc.text(`MEMBER ID: ECO-${member.id.padStart(4, '0')}`, 27, 42, { align: 'center' });

    // Inner details subtle capsule card background
    doc.setFillColor(17, 24, 39, 0.45);
    doc.roundedRect(4, 45, 46, 22, 2.5, 2.5, 'F');

    // Core details layout
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(3.5);
    doc.setTextColor(156, 163, 175); // slate 400
    
    // Coordinates
    const yStart = 49.5;
    const ySpacing = 4.2;

    // NAME FIELD
    doc.text('NAME:', 6, yStart);
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.2);
    doc.text(member.name.toUpperCase(), 19, yStart);

    // DEPT/ROLE FIELD
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(3.5);
    doc.setTextColor(156, 163, 175);
    doc.text('DEPT/ROLE:', 6, yStart + ySpacing);
    doc.setTextColor(243, 244, 246);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${(member.department || 'Economics').toUpperCase()} / ${member.role.toUpperCase()}`, 19, yStart + ySpacing);

    // ROLL/BATCH FIELD
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('ROLL/BATCH:', 6, yStart + ySpacing * 2);
    doc.setTextColor(243, 244, 246);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${(member.studentRoll || 'N/A').toUpperCase()} / ${(member.batchSession || 'N/A').toUpperCase()}`, 19, yStart + ySpacing * 2);

    // BLOOD/PHONE FIELD
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('BLOOD / MOB:', 6, yStart + ySpacing * 3);
    doc.setTextColor(251, 191, 36); // gold
    doc.setFont('Helvetica', 'bold');
    doc.text(`${(member.bloodGroup || 'B+').toUpperCase()}  |  ${member.phone}`, 19, yStart + ySpacing * 3);

    // Timeline / Date stamps separating divider line
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.18);
    doc.line(4, 69.5, 50, 69.5);

    // Timeline headings
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(3);
    doc.setTextColor(156, 163, 175);
    doc.text('DATE OF ISSUE', 6, 73.2);
    doc.text('EXPIRY DATE', 34, 73.2);

    // Timeline values
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.setTextColor(255, 255, 255);
    doc.text(issueDate, 6, 76.8);
    doc.setTextColor(239, 68, 68); // vibrant safety red for expiration date
    doc.text(expiryDate, 34, 76.8);

    // Mini mock barcode alignment details for physical tracking simulation
    doc.setFillColor(15, 23, 42);
    doc.rect(5, 78.8, 44, 4.2, 'F');
    // Draw fine custom lines simulating index barcode stripes
    doc.setFillColor(51, 65, 85);
    const mockCodeLines = [1, 2, 0.5, 1.2, 0.4, 2.5, 0.8, 0.4, 1.8, 0.4, 1, 0.8, 0.5, 2.2, 2, 0.4, 1.6];
    let barcodeXPos = 6.5;
    mockCodeLines.forEach((width) => {
      doc.rect(barcodeXPos, 79.2, width, 3.4, 'F');
      barcodeXPos += width + 0.35;
    });

    // Gold bottom chip decoration
    doc.setFillColor(217, 119, 6); // pure gold base line
    doc.rect(0, 84.5, 54, 1.5, 'F');


    // ==========================================
    // PAGE 2: REVERSE SIDE (TERMS & CRYPTOGRAPHIC QR)
    // ==========================================
    doc.addPage();

    doc.setFillColor(8, 12, 30); // deep night blue background
    doc.rect(0, 0, 54, 86, 'F');

    // Secure grid pattern on back of the card
    doc.setDrawColor(22, 28, 59);
    doc.setLineWidth(0.08);
    for (let i = 4; i < 86; i += 7) {
      doc.line(0, i, 54, i);
    }
    for (let j = 4; j < 54; j += 7) {
      doc.line(j, 0, j, 86);
    }

    // Header strip for Rules
    doc.setFillColor(17, 24, 39); // background box
    doc.rect(0, 0, 54, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.4);
    doc.text('LIBRARY DISCIPLINE & TERMS', 27, 5.5, { align: 'center' });

    // Rules text
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(2.8);
    const bulletX = 5;
    const ruleTextX = 8;
    
    doc.setTextColor(251, 191, 36); doc.text('•', bulletX, 13);
    doc.setTextColor(156, 163, 175); doc.text('This digital identification remains the property of MBSTU.', ruleTextX, 13);

    doc.setTextColor(251, 191, 36); doc.text('•', bulletX, 16.5);
    doc.setTextColor(156, 163, 175); doc.text('Present this RFID code at kiosk counter to loan books.', ruleTextX, 16.5);

    doc.setTextColor(251, 191, 36); doc.text('•', bulletX, 20);
    doc.setTextColor(156, 163, 175); doc.text('Cards and credentials are strictly non-transferable.', ruleTextX, 20);

    doc.setTextColor(251, 191, 36); doc.text('•', bulletX, 23.5);
    doc.setTextColor(156, 163, 175); doc.text('If resolved, return the found card to Economics Desk.', ruleTextX, 23.5);

    // QR Code container white box
    doc.setDrawColor(99, 102, 241); // indigo 500 border
    doc.setLineWidth(0.35);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 27, 24, 24, 1.8, 1.8, 'FD');

    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', 16, 28, 22, 22);
    }

    // Cryptographic security stamp Notice
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(3.6);
    doc.setTextColor(165, 180, 252);
    doc.text('★ CRYPTOGRAPHIC SECURE QR ★', 27, 54.5, { align: 'center' });

    // Technical barcode representation
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(2.6);
    doc.setTextColor(100, 116, 139);
    doc.text(`HASH ID: SHA256-${member.id.substring(0, 10).toUpperCase()}`, 27, 58, { align: 'center' });

    // Official Portal Url
    doc.setTextColor(243, 244, 246);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(3.4);
    doc.text('library.mbstu-econ.edu', 27, 62, { align: 'center' });

    // Signatures separator line
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.15);
    doc.line(11, 71, 43, 71);

    // Decorative Authenticity Rubber Ink Seal Circle
    doc.setDrawColor(217, 119, 6); // vintage amber stamp
    doc.setFillColor(254, 243, 199); // soft yellow amber tint
    doc.circle(41, 68, 4.2, 'FD');
    doc.setFontSize(1.8);
    doc.setTextColor(217, 119, 6);
    doc.setFont('Helvetica', 'bold');
    doc.text('APPROVED', 41, 67.5, { align: 'center' });
    doc.text('MBSTU', 41, 69.5, { align: 'center' });

    // Authorized signatory labeling
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(3.2);
    doc.text('REGISTRAR SIGNATURE & SEAL', 27, 75, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(2.6);
    doc.setTextColor(100, 116, 139);
    doc.text('Department of Economics, MBSTU', 27, 78.2, { align: 'center' });

    // Gold bottom chip decoration
    doc.setFillColor(217, 119, 65); // amber gold bottom line
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
            <p style=" এটি একটি অটোমেটেড মেইল। কোনো বিষয়ের জন্য সরাসরি এই ইমেইলে রিপ্লাই প্রদান করবেন না।</p>
            <p>&copy; ${new Date().getFullYear()} MBSTU Economics Department Library. All Rights Reserved.</p>
          </div>
        </div>
      `;

      const data = await db.sendEmailWithLog({
        to: member.email,
        subject: emailSubject,
        html: emailHtml,
        pdfAttachment: pdfDataUri,
        type: 'ID_CARD_DOWNLOAD'
      });

      if (data.success) {
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
          <span>{activeSide === 'front' ? 'পেছনের দিক' : 'সামনের দিক'}</span>
        </button>
      </div>

      {/* Visual Live Vector Card Preview in HTML container with interactive 3D Flip */}
      <div className="flex justify-center my-6">
        <div 
          onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
          className="relative w-[280px] h-[440px] [perspective:1200px] cursor-pointer group"
          title="কার্ড উল্টাতে ক্লিক করুন"
        >
          <div 
            className={`relative w-full h-full duration-700 [transform-style:preserve-3d] transition-all shadow-[0_0_50px_rgba(79,70,229,0.15)] hover:shadow-[0_0_60px_rgba(79,70,229,0.30)] hover:scale-[1.03] transition-all rounded-[28px] ${
              activeSide === 'back' ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* FRONT CARD PREVIEW */}
            <div 
              id="preview-card-front"
              className="absolute inset-0 w-full h-full bg-slate-950 rounded-[28px] border border-slate-800/80 overflow-hidden text-left flex flex-col justify-between [backface-visibility:hidden] select-none"
            >
              {/* High-security futuristic watermark background mesh */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4f46e5_1.2px,transparent_1.2px)] [background-size:10px_10px]" />
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:20px_20px]" />
              <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
              {/* Diagonal reflection shine stream across card */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none opacity-80" />

              {/* Header block with modern dark gradient and golden bar underneath */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 text-center py-4 px-3 border-b-2 border-amber-500/80 select-none relative shrink-0">
                <h5 className="text-[10px] font-black tracking-[0.12em] text-white leading-none">DEPARTMENT OF ECONOMICS</h5>
                <p className="text-[6.5px] text-indigo-300 mt-1 uppercase font-bold tracking-wider leading-none">Mawlana Bhashani Science & Technology University</p>
                
                {/* Secondary designation badge strip */}
                <div className="bg-amber-500 text-slate-950 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-center mt-2.5 rounded-md shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                  Membership Card
                </div>
              </div>

              {/* Body Content with smart spacing */}
              <div className="relative flex-1 flex flex-col justify-between p-4 z-10">
                
                {/* RFID Security Chip Indicator */}
                <div className="absolute top-2 left-2 w-[34px] h-[25px] bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-md shadow-md border border-amber-700/60 p-0.5 flex flex-col justify-between overflow-hidden opacity-90">
                  <div className="h-[1px] bg-amber-950/40 w-full" />
                  <div className="flex justify-between w-full">
                    <div className="w-[1px] bg-amber-950/40 h-3" />
                    <div className="w-[1px] bg-amber-950/40 h-3" />
                  </div>
                  <div className="h-[1px] bg-amber-950/40 w-full" />
                  {/* Miniature connection leads style chip */}
                  <div className="absolute inset-1 border-[0.5px] border-amber-950/20 rounded-md flex items-center justify-center">
                    <div className="w-1.5 h-full border-r border-l border-amber-950/30" />
                  </div>
                </div>

                {/* Avatar Portrait block (Layered glow framing) */}
                <div className="flex justify-center mt-3">
                  <div className="w-24 h-24 rounded-[24px] p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 shadow-xl shadow-indigo-950/50">
                    <div className="w-full h-full bg-slate-950 rounded-[22px] overflow-hidden flex items-center justify-center relative">
                      {member.photo && member.photo !== "" ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-[22px]" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 font-black text-white text-4xl flex items-center justify-center">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Identifier badging */}
                <div className="text-center mt-2.5">
                  <span className="inline-block px-3.5 py-1 bg-indigo-950/65 text-indigo-300 border border-indigo-500/30 font-mono font-black text-[10px] rounded-full tracking-widest shadow-md">
                    MEMBER ID: ECO-{member.id.padStart(4, '0')}
                  </span>
                </div>

                {/* Attributes grid list with clear elegant dividing bars */}
                <div className="space-y-1.5 text-[9.5px] pt-1.5 px-1">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1">
                    <span className="text-slate-500 font-extrabold uppercase text-[7.5px] w-16 shrink-0">Name:</span>
                    <span className="text-white font-mono font-black truncate text-[10px]">{member.name.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1">
                    <span className="text-slate-500 font-extrabold uppercase text-[7.5px] w-16 shrink-0">Dept/Role:</span>
                    <span className="text-slate-300 font-bold font-mono truncate text-[9.5px]">{`${(member.department || 'Economics').toUpperCase()} / ${member.role.toUpperCase()}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1">
                    <span className="text-slate-500 font-extrabold uppercase text-[7.5px] w-16 shrink-0">Roll/Batch:</span>
                    <span className="text-slate-300 font-bold font-mono truncate text-[9.5px]">{`${(member.studentRoll || 'N/A').toUpperCase()} / ${(member.batchSession || 'N/A').toUpperCase()}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-extrabold uppercase text-[7.5px] w-16 shrink-0">Blood / Mob:</span>
                    <span className="text-amber-400 font-black font-mono truncate text-[9.5px]">{`${(member.bloodGroup || 'B+').toUpperCase()}  |  ${member.phone}`}</span>
                  </div>
                </div>

              </div>

              {/* Digital Expiration/Issue Timelines footer */}
              <div className="px-6 py-2 border-t border-slate-900/60 flex justify-between text-[9px] bg-slate-950/60 relative z-10 shrink-0">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block text-slate-500 text-[7px]" style={{ fontSize: '7px' }}>Date of Issue</span>
                  <span className="text-slate-300 font-mono font-bold">{issueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider block text-slate-500 text-[7px]" style={{ fontSize: '7px' }}>Expiry Date</span>
                  <span className="text-rose-500 font-mono font-extrabold">{expiryDate}</span>
                </div>
              </div>

              {/* Barcode Emulator at bottom */}
              <div className="px-6 py-1.5 bg-slate-950 flex justify-center items-center h-8 relative z-10 border-t border-slate-900/30 shrink-0 select-none">
                <div className="w-full h-3 bg-slate-950 flex justify-between px-1.5 items-center opacity-60">
                  <div className="w-1 h-full bg-slate-300 rounded-sm" />
                  <div className="w-0.5 h-full bg-slate-300" />
                  <div className="w-1.5 h-full bg-slate-300" />
                  <div className="w-[3px] h-full bg-slate-300" />
                  <div className="w-[0.5px] h-full bg-slate-300" />
                  <div className="w-1 h-full bg-slate-300" />
                  <div className="w-2.5 h-full bg-slate-300" />
                  <div className="w-[1.2px] h-full bg-slate-300" />
                  <div className="w-0.5 h-full bg-slate-300" />
                  <div className="w-1.5 h-full bg-slate-300" />
                  <div className="w-[2px] h-full bg-slate-300" />
                </div>
              </div>

              {/* Base Amber Band with metallic gloss */}
              <div className="h-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 w-full shrink-0" />
            </div>

            {/* BACK CARD PREVIEW (with [transform:rotateY(180deg)]) */}
            <div 
              id="preview-card-back"
              className="absolute inset-0 w-full h-full bg-slate-950 rounded-[28px] border border-slate-800/80 overflow-hidden text-left flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] select-none"
            >
              {/* High-security watermark on back */}
              <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[radial-gradient(#4f46e5_1.2px,transparent_1.2px)] [background-size:10px_10px]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

              {/* Back header with Terms Title */}
              <div className="bg-slate-950 border-b border-indigo-950/60 text-center py-3 shrink-0">
                <span className="text-[9.5px] font-black tracking-widest text-slate-300 uppercase">Library Terms & Directions</span>
              </div>

              {/* Bullet points on back */}
              <div className="px-5 space-y-2 text-[8px] text-slate-404 text-slate-400 font-bold pt-3 shrink-0 leading-snug">
                <p className="flex items-start gap-1.5"><span className="text-amber-500 font-serif">•</span> This digital identification card remains the property of MBSTU.</p>
                <p className="flex items-start gap-1.5"><span className="text-amber-500 font-serif">•</span> Present this RFID code/QR at the scanner kiosk to authentic loans.</p>
                <p className="flex items-start gap-1.5"><span className="text-amber-500 font-serif">•</span> Transferring or counterfeiting this card is strictly void.</p>
                <p className="flex items-start gap-1.5"><span className="text-amber-500 font-serif">•</span> If found, please return immediately to Economics Desk.</p>
              </div>

              {/* QR Code central container with nice styling */}
              <div className="flex flex-col items-center justify-center py-2 relative z-10 flex-1">
                <div className="p-2 bg-white rounded-2xl border border-indigo-500/30 shadow-lg relative group">
                  <img 
                    src={qrImageUrl} 
                    alt="QR Verification Link" 
                    className="w-[96px] h-[96px] bg-white rounded-md shrink-0"
                  />
                  {/* Subtle target framing lines inside QR padding box */}
                  <div className="absolute -inset-0.5 border border-amber-500/15 rounded-2xl pointer-events-none" />
                </div>
                
                {/* Cryptographic identification tag info */}
                <span className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest mt-2 animate-pulse">
                  ★ CRYPTOGRAPHIC SECURE QR ★
                </span>
                <span className="text-[6.5px] text-slate-500 font-mono mt-0.5">
                  HASH ID: SHA256-{member.id.substring(0, 12).toUpperCase()}...
                </span>
              </div>

              {/* Official domain pointer */}
              <div className="text-center text-[8.5px] text-indigo-300 font-mono tracking-widest mb-1.5">
                library.mbstu-econ.edu
              </div>

              {/* Signatures sealing block with authorized ink visual stamps underlay */}
              <div className="px-5 pb-2.5 pt-1 text-center relative z-10 border-t border-slate-900/60 bg-slate-950/60 shrink-0">
                {/* Vintage Ink Seal Ring Overlapping Signature */}
                <div className="absolute right-5 bottom-2.5 w-11 h-11 rounded-full border border-amber-600/30 flex flex-col justify-center items-center text-amber-500/30 -rotate-12 select-none pointer-events-none text-center">
                  <span className="text-[4px] font-black uppercase tracking-wide leading-none">APPROVED</span>
                  <span className="text-[3px] font-extrabold mt-0.5">MBSTU ECON</span>
                </div>

                <div className="h-px bg-slate-800 mx-auto w-[180px]" />
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mt-1">Authorized Department Seal</span>
                <span className="text-[6.5px] text-slate-500 block leading-tight">Mawlana Bhashani Science & Technology University</span>
              </div>

              {/* Bottom gold bar */}
              <div className="h-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 w-full shrink-0" />
            </div>
          </div>
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
