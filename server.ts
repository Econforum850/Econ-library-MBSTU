import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Load environment variables from .env file
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function getSMTPSettingsFromFirestore() {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check if the app is already initialized to avoid duplicate initialization error
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    const smtpDocRef = doc(db, 'settings', 'smtp');
    const snapshot = await getDoc(smtpDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
  } catch (error) {
    console.error('[firebase-backend] Error fetching SMTP settings:', error);
  }
  return null;
}

// Setup nodemailer transporter bound dynamically to Gmail credentials
async function getTransporter() {
  let user = (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim();
  let pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!pass) {
    console.log('[SMTP Server] GMAIL_APP_PASSWORD is blank. Attempting Firestore DB credentials fallback.');
    const dbSettings = await getSMTPSettingsFromFirestore();
    if (dbSettings && dbSettings.gmailAppPassword) {
      if (dbSettings.gmailUser) {
        user = dbSettings.gmailUser.trim();
      }
      pass = dbSettings.gmailAppPassword.trim();
      console.log('[SMTP Server] Loaded credentials from Firestore successfully.');
    }
  }

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
    const transporter = await getTransporter();
    await transporter.verify();
    res.json({
      success: true,
      message: 'SMTP connection successfully established with Gmail!',
      user: process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd (default fallback)'
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

// Secure API endpoint for AI Reading Assistant proxying the Gemini API
app.post('/api/gemini/assist', async (req: express.Request, res: express.Response) => {
  const { action, text, bookTitle, chapter } = req.body;
  if (!action || !text) {
    res.status(400).json({ error: 'Missing action or text parameter' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured on the server. Please add GEMINI_API_KEY to AI Studio Settings.', 
    });
    return;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let prompt = '';
    if (action === 'summarize') {
      prompt = `Summarize this text in detail, focusing on key takeaways for university economics students. Book: "${bookTitle || 'Unknown'}", Chapter/Section: "${chapter || 'Current'}". Text to summarize:\n\n${text}`;
    } else if (action === 'explain') {
      prompt = `Provide a clear, simple, and detailed explanation of this paragraph for college students. Explain any complex library, economics vocabulary, or theories mentioned. Text:\n\n${text}`;
    } else if (action === 'mcq') {
      prompt = `Generate 4 educational multiple-choice questions (MCQs) with 4 options (A, B, C, D) each, plus the correct answers and brief explanations based on this text. Keep the format clean and highly readable. Text:\n\n${text}`;
    } else if (action === 'points') {
      prompt = `Extract the most important points, lists, or core concepts from this text as key bullet points. Text to inspect:\n\n${text}`;
    } else {
      prompt = `Assist with this reading material. Text:\n\n${text}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
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
    const senderUser = process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd';
    console.log(`[SMTP Attempt] Initiating email dispatch to: ${to} with subject: "${subject}" from sender: ${senderUser}`);
    const mailOptions: any = {
      from: `"MBSTU Econ Library & Organisation" <${senderUser}>`,
      to,
      subject,
      html
    };

    if (req.body.customAttachment) {
      const attachment = req.body.customAttachment;
      const base64Data = attachment.base64.split(';base64,').pop() || '';
      mailOptions.attachments = [
        {
          filename: attachment.filename || 'attachment.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: attachment.contentType || 'application/octet-stream'
        }
      ];
    } else if (req.body.pdfAttachment) {
      const base64Data = req.body.pdfAttachment.split(';base64,').pop() || '';
      mailOptions.attachments = [
        {
          filename: 'library_card.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'application/pdf'
        }
      ];
    }

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email dispatched successfully to ${to}. Message-ID: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, sender: senderUser });
  } catch (err: any) {
    const senderUser = process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd';
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
