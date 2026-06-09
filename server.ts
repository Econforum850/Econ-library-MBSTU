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
  const { action, text, bookTitle, chapter, prompt: bodyPrompt } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured on the server. Please add GEMINI_API_KEY to AI Studio Settings.', 
    });
    return;
  }

  // Fallback engine definitions in case Gemini fails
  const getOfflineResponse = (queryAction: string, queryText: string, fullPrompt: string) => {
    const isBengali = /[\u0980-\u09FF]/.test(queryText || fullPrompt);
    const contentToParse = queryText || fullPrompt || '';
    const sentences = contentToParse.split(/[.।?!\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 8);

    if (queryAction === 'mcq' || fullPrompt.toLowerCase().includes('mcq') || fullPrompt.toLowerCase().includes('question') || fullPrompt.toLowerCase().includes('quizzes')) {
      let mcqText = isBengali 
        ? "📝 [অফলাইন ব্যাকআপ কুইজ জেনারেটর]\n\n" 
        : "📝 [Offline Backup Quiz Generator]\n\n";
      const count = Math.min(3, sentences.length);
      if (count === 0) {
        return isBengali 
          ? "টেক্সট থেকে কুইজ তৈরি করার পর্যাপ্ত তথ্য পাওয়া যায়নি।" 
          : "Insufficient text provided to generate practice quizzes.";
      }
      for (let i = 0; i < count; i++) {
        const s = sentences[i];
        const words = s.split(/\s+/);
        const blankWord = words[Math.floor(words.length / 2)] || '___';
        const question = s.replace(blankWord, "______");
        
        mcqText += `${isBengali ? 'প্রশ্ন' : 'Q'}${i + 1}: ${question}?\n`;
        mcqText += `A) ${blankWord}\n`;
        mcqText += `B) ${words[0] || 'Option B'}\n`;
        mcqText += `C) ${words[words.length - 1] || 'Option C'}\n`;
        mcqText += `D) ${isBengali ? 'কোনটিই নয়' : 'None of the above'}\n`;
        mcqText += `সঠিক উত্তর: A\n\n`;
      }
      return mcqText;
    }

    if (queryAction === 'points' || fullPrompt.toLowerCase().includes('points') || fullPrompt.toLowerCase().includes('bullet')) {
      const titleLabel = isBengali ? "📌 [অফলাইন ব্যাকআপ গুরুত্বপূর্ণ বিষয়সমূহ]" : "📌 [Offline Backup Core Concepts]";
      const items = sentences.slice(0, 5).map(s => `• ${s}`).join('\n');
      return `${titleLabel}\n\n${items || (isBengali ? 'তথ্য বিশ্লেষণ করা সম্ভব হয়নি।' : 'Could not analyse the source text.')}`;
    }

    // Default: Summary or general assistance
    const intro = isBengali 
      ? "📖 [অফলাইন ব্যাকআপ পাঠ্য সারসংক্ষেপ ও বিশ্লেষণ]" 
      : "📖 [Offline Backup Reading Summary & Analysis]";
    const body = sentences.slice(0, 4).map(s => `• ${s}`).join('\n');
    return `${intro}\n\n${body || contentToParse}\n\n_${isBengali ? '*দ্রষ্টব্য: গুগল এআই এপিআই সংযোগ বা কোটা জটিলতার কারণে সুরক্ষামূলক অফলাইন ব্যাকআপ রেসপন্স ব্যবহৃত হয়েছে।*' : '*Note: Graceful offline backup generator triggered due to Google Cloud Project API restrictions.*'}_`;
  };

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
    let resolvedAction = action || '';
    let resolvedText = text || '';

    if (bodyPrompt) {
      prompt = bodyPrompt;
    } else {
      if (!action || !text) {
        // Fallback or accept prompt if we can guess
        if (req.body.prompt) {
          prompt = req.body.prompt;
        } else {
          res.status(400).json({ error: 'Missing action or text parameter' });
          return;
        }
      } else {
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
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    res.json({ success: true, result: response.text });
  } catch (error: any) {
    console.warn('[Gemini API - Falling back to local/offline engine]:', error.message || error);
    // Return successful local fallback response so student's app NEVER breaks!
    const fallbackText = getOfflineResponse(action || '', text || '', bodyPrompt || req.body.prompt || '');
    res.json({ success: true, result: fallbackText });
  }
});

// Secure endpoint to process and analyze book covers using advanced multimodal Gemini
app.post('/api/gemini/analyze-book-cover', async (req: express.Request, res: express.Response) => {
  const { imageBase64, mimeType } = req.body;
  
  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: 'Missing imageBase64 or mimeType parameter' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured on the server. Please configure it in your Secrets settings.' 
    });
    return;
  }

  // Define max retries for reliability if parsing or API fails
  const MAX_RETRIES = 2;
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= MAX_RETRIES) {
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare visual and textual inputs
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      };

      const textPart = {
        text: `You are an AI-powered library cataloging agent (similar to Google Lens). 
        Analyze this book cover image. Run OCR to carefully extract the information. 
        Enforce strict field mapping to avoid hallucinations.
        
        Guidelines:
        1. Extract the 'title' (বইয়ের শিরোনাম) precisely. Keep standard Bengali/English scripts as printed on the book.
        2. Extract the 'author' (লেখকের নাম) precisely.
        3. Infer a relevant 'category' based on the book topic (e.g., 'অর্থনীতি', 'পরিসংখ্যান', 'গণিত', 'ইসলামী বই', 'সাধারণ', 'Nobel Literature', 'Research').
        4. If a 'price' or retail price is readable on cover, extract it (e.g. ৳৩৫০), otherwise leave it blank "".
        5. Set 'confidence' to a number from 0.0 to 1.0 depending on text legibility and your certainty.
        6. Set 'needVerification' to true if 'title' or 'author' cannot be reliably deciphered (e.g. text is too small, cut off, blurred, or confidence is under 0.75). Otherwise set to false.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [imagePart, textPart],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              needVerification: { type: Type.BOOLEAN }
            },
            required: ["title", "author", "category", "price", "confidence", "needVerification"]
          }
        }
      });

      const extractedText = response.text?.trim() || '{}';
      const resultObj = JSON.parse(extractedText);

      // Successfully processed and parsed JSON structured response
      res.json({ success: true, result: resultObj });
      return;

    } catch (err: any) {
      const errMsg = err.message || '';
      console.warn(`[Gemini OCR API Catch Error] ${errMsg}`);
      
      const isPermanent = errMsg.includes('PERMISSION_DENIED') || 
                          errMsg.includes('403') || 
                          errMsg.includes('QUOTA_EXHAUSTED') || 
                          errMsg.includes('429') || 
                          errMsg.includes('denied');
      
      if (isPermanent) {
        console.info(`[Gemini API Permanent Error - Bypassing retries and calling client fallback]: ${errMsg}`);
        res.json({
          success: true,
          useClientOcrFallback: true,
          message: `GCP Project restriction or quota reached (${errMsg}). Smoothly defaulting to client-side OCR engine...`
        });
        return;
      }

      attempt++;
      lastError = err;
      // Wait a short moment before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // All attempts failed
  console.info('[Gemini API - All attempts failed. Defaulting to client OCR fallback]');
  res.json({ 
    success: true,
    useClientOcrFallback: true,
    message: 'Failed to analyze book cover via Gemini. Smoothly defaulting to client-side OCR engine...'
  });
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
