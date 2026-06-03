import { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ override: true });

// Helper to parse JSON body since Vercel's standard bodies are parsed, but let's be super safe and parse robustly
interface RequestWithBody extends IncomingMessage {
  body?: any;
}

// Setup nodemailer transporter dynamically to Gmail credentials
function getTransporter() {
  const user = (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim();
  let pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!pass) {
    throw new Error('Gmail SMTP Configuration Error: GMAIL_APP_PASSWORD environment variable is missing or empty. Please create an App Password in your Google Account Security settings and add it to GMAIL_APP_PASSWORD under AI Studio Settings tab.');
  }

  // Remove any spaces (including spaces inside the 16-character google app password) and trim whitespace
  pass = pass.trim().replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });
}

export default async function handler(req: RequestWithBody, res: ServerResponse & { status: (code: number) => any; json: (data: any) => any }) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405);
    res.json({ error: 'Method not allowed' });
    return;
  }

  let recipientEmail = 'unknown';

  try {
    // Vercel pre-parses req.body, but if it doesn't, we can fallback
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { to, subject, html, pdfAttachment, customAttachment } = body || {};

    if (!to || !subject || !html) {
      res.status(400);
      res.json({ error: 'Missing standard parameters [to, subject, html]' });
      return;
    }

    recipientEmail = to;

    const senderUser = process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd';
    console.log(`[SMTP Attempt SV] Initiating email dispatch to: ${to} with subject: "${subject}" from sender: ${senderUser}`);
    const mailOptions: any = {
      from: `"MBSTU Econ Library & Organisation" <${senderUser}>`,
      to,
      subject,
      html
    };

    if (customAttachment) {
      const base64Data = customAttachment.base64.split(';base64,').pop() || '';
      mailOptions.attachments = [
        {
          filename: customAttachment.filename || 'attachment.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: customAttachment.contentType || 'application/octet-stream'
        }
      ];
    } else if (pdfAttachment) {
      const base64Data = pdfAttachment.split(';base64,').pop() || '';
      mailOptions.attachments = [
        {
          filename: 'library_card.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'application/pdf'
        }
      ];
    }

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success SV] Email dispatched successfully to ${to}. Message-ID: ${info.messageId}`);
    res.status(200);
    res.json({ success: true, messageId: info.messageId, sender: senderUser });
  } catch (err: any) {
    const senderUser = process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd';
    console.error(`[SMTP Failure SV] Email send failed for ${recipientEmail}:`, err);
    res.status(500);
    res.json({ 
      error: 'SMTP mail transmission failed.', 
      details: err.message,
      sender: senderUser
    });
  }
}
