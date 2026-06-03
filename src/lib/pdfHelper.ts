import { jsPDF } from 'jspdf';
import { SupabaseMember } from './supabaseDatabase';

export const urlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve('');
      return;
    }
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
        reject(new Error('Canvas contextual error'));
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export async function generateLibraryCardPdf(member: SupabaseMember): Promise<string> {
  // CR-80 Vertical Card format: [54, 86]
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [54, 86]
  });

  // Calculate Dates
  let issueDate = '';
  let expiryDate = '';
  if (member.joinDate && member.joinDate.includes('|')) {
    const parts = member.joinDate.split('|');
    issueDate = parts[0];
    expiryDate = parts[1];
  } else {
    issueDate = member.joinDate || new Date().toLocaleDateString('bn-BD');
    const parts = issueDate.split('/');
    if (parts.length === 3) {
      expiryDate = `${parts[0]}/${parts[1]}/${parseInt(parts[2]) + 4}`;
    } else {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 4);
      expiryDate = d.toLocaleDateString('bn-BD');
    }
  }

  // Convert QR Code URL to base64
  const qrPayload = JSON.stringify({
    cardId: `card-${member.id}`,
    memberNumber: `ECO-2026-${member.id.substring(member.id.length - 3).toUpperCase()}`,
    name: member.name,
    status: 'active'
  });
  const verificationUrl = `https://mbstu-econ.edu/verify?payload=${btoa(encodeURIComponent(qrPayload))}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationUrl)}`;
  
  let qrBase64 = '';
  try {
    qrBase64 = await urlToBase64(qrImageUrl);
  } catch (err) {
    console.warn('QR Code conversion failed:', err);
  }

  // Convert Avatar url
  let avatarBase64 = '';
  if (member.photo) {
    let photoUrl = member.photo;
    if (photoUrl.startsWith('/')) {
      photoUrl = window.location.origin + photoUrl;
    }
    if (photoUrl.startsWith('data:')) {
      avatarBase64 = photoUrl;
    } else if (photoUrl.startsWith('http')) {
      try {
        avatarBase64 = await urlToBase64(photoUrl);
      } catch (err) {
        console.warn('Avatar photo conversion failed:', err);
      }
    }
  }

  // PAGE 1: FRONT
  doc.setFillColor(15, 23, 42); // slate 900 background
  doc.rect(0, 0, 54, 86, 'F');

  doc.setFillColor(79, 70, 229); // Indigo 600 top badge
  doc.rect(0, 0, 54, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('DEPARTMENT OF ECONOMICS', 27, 4, { align: 'center' });
  doc.setFontSize(4);
  doc.setTextColor(199, 210, 254); // indigo 200
  doc.text('MBSTU UNIVERSITY AND LIBRARY', 27, 7, { align: 'center' });

  doc.setFillColor(17, 24, 39); // slate 950 subheader
  doc.rect(0, 9, 54, 5, 'F');
  doc.setTextColor(253, 224, 71); // gold 300
  doc.setFontSize(4.5);
  doc.text('★ MEMBERSHIP IDENTITY CARD ★', 27, 12, { align: 'center' });

  // Photo Frame
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.setFillColor(241, 245, 249);
  doc.rect(17, 18, 20, 20, 'FD');

  if (avatarBase64) {
    try {
      let format = 'JPEG';
      if (avatarBase64.startsWith('data:image/png')) format = 'PNG';
      doc.addImage(avatarBase64, format, 17, 18, 20, 20);
    } catch {
      doc.setFillColor(79, 70, 229);
      doc.rect(17, 18, 20, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(member.name.charAt(0).toUpperCase(), 27, 30, { align: 'center' });
    }
  } else {
    doc.setFillColor(79, 70, 229);
    doc.rect(17, 18, 20, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(member.name.charAt(0).toUpperCase(), 27, 30, { align: 'center' });
  }

  // Member ID
  doc.setFillColor(30, 41, 59); // slate 800
  doc.roundedRect(8, 41, 38, 5, 1, 1, 'F');
  doc.setTextColor(129, 140, 248); // indigo 400
  doc.setFontSize(4.5);
  doc.setFont('Helvetica', 'bold');
  const uniqueIdStr = `MEMBERSHIP ID: ECO-${member.id.padStart(4, '0')}`;
  doc.text(uniqueIdStr, 27, 44.5, { align: 'center' });

  // Member core parameters
  doc.setTextColor(248, 250, 252);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.text('NAME:', 6, 49.5);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4.4);
  doc.text(member.name.toUpperCase(), 19, 49.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.text('DEPT/ROLE:', 6, 53.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${(member.department || 'Economics').toUpperCase()} / ${member.role.toUpperCase()}`, 19, 53.5);

  doc.setFont('Helvetica', 'normal');
  doc.text('ROLL/BATCH:', 6, 57.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${(member.studentRoll || 'N/A').toUpperCase()} / ${(member.batchSession || 'N/A').toUpperCase()}`, 19, 57.5);

  doc.setFont('Helvetica', 'normal');
  doc.text('BLOOD/PHONE:', 6, 61.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${(member.bloodGroup || 'B+').toUpperCase()} / ${member.phone}`, 19, 61.5);

  // Expiry / Issue line separation
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

  doc.setFillColor(234, 179, 8); // amber gold bottom line
  doc.rect(0, 84.5, 54, 1.5, 'F');

  // PAGE 2: REVERSE
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 54, 86, 'F');

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 54, 8, 'F');
  doc.setTextColor(241, 245, 249);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('TERMS & CONDITIONS', 27, 5.5, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(3.2);
  doc.text('1. This digital identity card is non-transferable.', 5, 13);
  doc.text('2. Please present this card for scanning during book issues.', 5, 17);
  doc.text('3. In case of loss, contact the Economics Department Desk.', 5, 21);
  doc.text('4. This card remains the official property of MBSTU.', 5, 25);

  // Display QR Code
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 30, 26, 26, 1.5, 1.5, 'FD');

  if (qrBase64) {
    doc.addImage(qrBase64, 'PNG', 15, 31, 24, 24);
  }

  doc.setTextColor(129, 140, 248);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(4);
  doc.text('[ SCAN QR FOR VALIDITY ]', 27, 60, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('Helvetica', 'normal');
  doc.text('www.mbstu-econ.edu', 27, 64, { align: 'center' });

  doc.line(12, 75, 42, 75);
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(3.8);
  doc.text('AUTHORIZED SIGNATORY STAMP', 27, 79, { align: 'center' });

  doc.setFillColor(234, 179, 8);
  doc.rect(0, 84.5, 54, 1.5, 'F');

  return doc.output('datauristring');
}
