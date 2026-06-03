import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup nodemailer transporter bound dynamically to Gmail credentials
function getTransporter() {
  const user = (process.env.GMAIL_USER || 'eeconlibrary.mbstu@gmail.com').trim();
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

// SMTP diagnostics endpoint to verify credentials in realtime
app.get('/api/test-email', async (req, res) => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    res.json({
      success: true,
      message: 'SMTP connection successfully established with Gmail!',
      user: process.env.GMAIL_USER || 'eeconlibrary.mbstu@gmail.com (default fallback)'
    });
  } catch (err: any) {
    console.error('SMTP verification failed:', err);
    res.json({
      success: false,
      message: 'SMTP verification failed',
      error: err.message,
      stack: err.stack,
      user: process.env.GMAIL_USER || 'None loaded'
    });
  }
});

// Secure API endpoint to dispatch membership and ID Card confirmations
app.post('/api/send-email', async (req: express.Request, res: express.Response) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    res.status(400).json({ error: 'Missing standard parameters [to, subject, html]' });
    return;
  }

  try {
    const senderUser = process.env.GMAIL_USER || 'eeconlibrary.mbstu@gmail.com';
    console.log(`[SMTP Attempt] Initiating email dispatch to: ${to} with subject: "${subject}" from sender: ${senderUser}`);
    const mailOptions: any = {
      from: `"MBSTU Econ Library & Organisation" <${senderUser}>`,
      to,
      subject,
      html
    };

    if (req.body.pdfAttachment) {
      const base64Data = req.body.pdfAttachment.split(';base64,').pop();
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
    console.log(`[SMTP Success] Email dispatched successfully to ${to}. Message-ID: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, sender: senderUser });
  } catch (err: any) {
    const senderUser = process.env.GMAIL_USER || 'eeconlibrary.mbstu@gmail.com';
    console.error(`[SMTP Failure] Core Email sending module error sending to ${to}:`, err);
    res.status(500).json({ 
      error: 'SMTP mail transmission failed.', 
      details: err.message,
      sender: senderUser,
      troubleshooting: 'Please verify if 2-Step Verification is enabled and an App Password is used instead of raw credentials in Gmail settings.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
