import { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

// Helper to parse JSON body since Vercel's standard bodies are parsed, but let's be super safe and parse robustly
interface RequestWithBody extends IncomingMessage {
  body?: any;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eeconlibrary.mbstu@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'eeconlibrary.mbstu@gmail.com@#'
  }
});

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

  try {
    // Vercel pre-parses req.body, but if it doesn't, we can fallback
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { to, subject, html, pdfAttachment } = body || {};

    if (!to || !subject || !html) {
      res.status(400);
      res.json({ error: 'Missing standard parameters [to, subject, html]' });
      return;
    }

    const mailOptions: any = {
      from: '"MBSTU Econ Library & Organisation" <eeconlibrary.mbstu@gmail.com>',
      to,
      subject,
      html
    };

    if (pdfAttachment) {
      const base64Data = pdfAttachment.split(';base64,').pop();
      mailOptions.attachments = [
        {
          filename: 'library_card.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'application/pdf'
        }
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    res.status(200);
    res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Vercel Serverless Email send failed:', err);
    res.status(500);
    res.json({ 
      error: 'SMTP mail transmission failed.', 
      details: err.message 
    });
  }
}
