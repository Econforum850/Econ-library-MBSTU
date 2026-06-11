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
    const errMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || '');
    const isPermanent = errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('denied');
    
    if (isPermanent) {
      console.info('[Gemini API - Project Access Restricted / 403. Smoothly bypassing models to trigger offline backup.]');
    } else {
      console.warn('[Gemini API - Falling back to local/offline engine]:', error.message || error);
    }
    
    // Return successful local fallback response so student's app NEVER breaks!
    const fallbackText = getOfflineResponse(action || '', text || '', bodyPrompt || req.body.prompt || '');
    res.json({ success: true, result: fallbackText });
  }
});

// Helper function for multi-model rotation & retry mechanism
async function generateContentWithRetry(ai: any, baseRequestArgs: any) {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const attempt = i + 1;
    try {
      console.log(`[এআই স্ক্যানার] চেষ্টা ${attempt}/${modelsToTry.length} মডেল: "${currentModel}"`);
      
      const requestArgs = {
        ...baseRequestArgs,
        model: currentModel,
      };

      const response = await ai.models.generateContent(requestArgs);
      if (response && (response.text || response.candidates)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      
      const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err) || '');
      const isPermanent = errMsg.includes('PERMISSION_DENIED') || 
                          errMsg.includes('403') || 
                          errMsg.includes('QUOTA_EXHAUSTED') || 
                          errMsg.includes('denied');
      
      if (isPermanent) {
        // Abort rotation immediately on permanent permission denied or quota exhausted issue
        console.warn(`[এআই স্ক্যানার] স্থায়ী ক্লিয়ারেন্স / পারমিশন সমস্যা সনাক্ত হয়েছে (${currentModel})। রোটেশন এড়ানো হচ্ছে।`);
        throw err;
      }

      console.warn(`[এআই স্ক্যানার] ব্যর্থ হয়েছে "${currentModel}":`, err.message || err);
      
      if (i < modelsToTry.length - 1) {
        const jitter = Math.round(Math.random() * 8) * 100;
        const delay = 500 + jitter; // processing is kept fast with slight delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('সবগুলো মডেল ট্রাই করার পরেও এআই রেসপন্স দিতে ব্যর্থ হয়েছে।');
}

// Secure endpoint to process and analyze book covers using advanced multimodal Gemini
app.post('/api/gemini/analyze-book-cover', async (req: express.Request, res: express.Response) => {
  const { imageBase64, mimeType: bodyMimeType, image, categories } = req.body;
  const inputImage = image || imageBase64;
  
  if (!inputImage) {
    res.status(400).json({ error: 'Missing book cover image data (imageBase64 or image parameter)' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured on the server. Please configure it in your Secrets settings.' 
    });
    return;
  }

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

    // clean base64 payload helper
    let resolvedMimeType = bodyMimeType || 'image/jpeg';
    if (inputImage.startsWith('data:')) {
      const match = inputImage.match(/data:([^;]+);base64,/);
      if (match) resolvedMimeType = match[1];
    }
    
    let cleanBase64 = inputImage.includes(';base64,') ? inputImage.split(';base64,').pop() : (inputImage.includes(',') ? inputImage.split(',').pop() : inputImage);
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    // Prepare visual and textual inputs
    const imagePart = {
      inlineData: {
        mimeType: resolvedMimeType,
        data: cleanBase64,
      },
    };

    const categoriesPrompt = categories && categories.length > 0 
      ? `\nChoose the closest matching category from this list: ${JSON.stringify(categories)}. Otherwise suggest best Bengali/English category.`
      : '';

    const textPart = {
      text: `You are an advanced high-accuracy visual OCR and book cataloging intelligence system (similar to Google Lens).
Analyze the book cover/spine image with extreme precision. Since this is for Bangladeshi readers and academic environments, recognize both Bengali (বাংলা) and English text perfectly.

Strict Parsing and Extraction Rules:
1. raw_text_detected: Transcribe all visible text segments accurately.
2. reasoning_and_extraction_notes: Deconstruct the detected text. Distinguish the Book Title from publishing houses (like 'প্রথমা', 'অন্যপ্রকাশ', 'ঐতিহ্য', 'অনন্যা', 'কাকলী', 'সময়', 'বাতিঘর', 'নওরোজ', 'তাম্রলিপি', 'আদর্শ', 'কথা প্রকাশ', 'চারুলিপি', 'শোভা', 'অনিন্দ্য' which are publishers, NOT the primary titles or authors).
3. title: Extract ONLY the book's title precisely. Avoid publishing names, taglines, or series prefixes inside it. Keep standard Bengali/English scripts.
4. author: Identify the primary author cleanly. Format translated books customly as: "Original Author (অনুবাদ: Translator Name)".
5. category: Infer the closest matching category based on the topic. Prefers: 'অর্থনীতি' (for Economics/Finance), 'পরিসংখ্যান' (for Statistics), 'গণিত' (for Mathematics), 'ইসলামী বই', 'গল্প', or 'সাধারণ'.${categoriesPrompt}
6. price: Extract only numbers with currency context (e.g., "৳৩৫০" or "350"). If none is legible, leave as empty "".
7. stock: Set initial safe baseline stock value (e.g., 1 or 2).
8. description: Elaborate a short 1-2 sentence Bengali summary/description if legible or known.
9. overall_confidence_score: Floating point score between 0.0 to 1.0 indicating clarity and correctness of the title/author match.
10. requires_manual_confirmation: Boolean. Set to true if overall confidence is under 0.75, or the title/author is heavily guessed, blurred, or unknown; otherwise false.`,
    };

    const requestArgsWithoutModel = {
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            raw_text_detected: { type: Type.STRING },
            reasoning_and_extraction_notes: { type: Type.STRING },
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.STRING },
            stock: { type: Type.INTEGER },
            description: { type: Type.STRING },
            shelfNo: { type: Type.STRING },
            isbn: { type: Type.STRING },
            title_confidence: { type: Type.STRING },
            author_confidence: { type: Type.STRING },
            overall_confidence_score: { type: Type.NUMBER },
            requires_manual_confirmation: { type: Type.BOOLEAN }
          },
          required: ["title"]
        }
      }
    };

    // First attempt using model rotation/retry mechanism
    const response = await generateContentWithRetry(ai, requestArgsWithoutModel);
    let resultObj = JSON.parse(response.text || '{}');

    // Intelligent low-confidence mechanism (Double-check pass)
    const isConfidenceLow = !resultObj.title || 
                            resultObj.title.trim() === '' || 
                            resultObj.title.toLowerCase() === 'unknown' ||
                            resultObj.title.toLowerCase() === 'untitled' ||
                            (resultObj.overall_confidence_score < 0.72) ||
                            resultObj.title_confidence === 'low' ||
                            resultObj.author_confidence === 'low' ||
                            !resultObj.author || 
                            resultObj.author.toLowerCase() === 'unknown';

    if (isConfidenceLow) {
      console.log(`[এআই স্ক্যানার] প্রথম দফায় কনফিডেন্স কম এসেছে। ২য় ডাবল-চেক পাস শুরু হচ্ছে...`);
      const doubleCheckArgs = {
        contents: [
          imagePart,
          {
            text: `You are double-checking OCR results for a book cover.
            Initial detected data: ${JSON.stringify(resultObj)}
            Please re-analyze the image carefully and extract accurate Title & Author name. Avoid publisher name duplication.
            Return ONLY raw JSON conforming exactly to the requested schema.`
          }
        ],
        config: requestArgsWithoutModel.config
      };

      try {
        const doubleResponse = await generateContentWithRetry(ai, doubleCheckArgs);
        const doubleParsed = JSON.parse(doubleResponse.text || '{}');
        if (doubleParsed && doubleParsed.title && doubleParsed.title.toLowerCase() !== 'unknown') {
          resultObj = {
            ...resultObj,
            ...doubleParsed,
            overall_confidence_score: Math.max(resultObj.overall_confidence_score || 0, doubleParsed.overall_confidence_score || 0.8),
            requires_manual_confirmation: doubleParsed.requires_manual_confirmation ?? true
          };
          console.log('[Gemini Refinement Success]: Double-checked book metadata refined successfully to:', resultObj.title);
        }
      } catch (doubleErr) {
        console.warn(`[এআই স্ক্যানার] ২য় ডাবল-চেক পাস ব্যর্থ হয়েছে:`, doubleErr);
        resultObj.requires_manual_confirmation = true;
      }
    }

    // Verify and enrich parsed OCR data using Google Books lookup as third safety layer
    if (resultObj.title && resultObj.title !== 'Unknown Title' && resultObj.title.trim().length > 3) {
      try {
        const searchQuery = `${resultObj.title} ${resultObj.author || ''}`.trim();
        const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1`;
        const gbRes = await fetch(googleBooksUrl);
        if (gbRes.ok) {
          const gbData = await gbRes.json();
          if (gbData && gbData.items && gbData.items.length > 0) {
            const gbInfo = gbData.items[0].volumeInfo;
            const gbTitleLower = gbInfo.title.toLowerCase();
            const extTitleLower = resultObj.title.toLowerCase();
            
            // If there's a strong title sub-phrase or author match, substitute with official catalog info
            const isTitleMatch = gbTitleLower.includes(extTitleLower) || extTitleLower.includes(gbTitleLower);
            const isAuthorMatch = resultObj.author && gbInfo.authors && gbInfo.authors.some((a: string) => a.toLowerCase().includes(resultObj.author.toLowerCase()));
            
            if (isTitleMatch || isAuthorMatch) {
              console.log(`[Google Books Enrichment Match]: Corrected "${resultObj.title}" -> "${gbInfo.title}"`);
              resultObj.title = gbInfo.title;
              if (gbInfo.authors && gbInfo.authors.length > 0) {
                resultObj.author = gbInfo.authors.join(', ');
              }
              if (gbInfo.description) {
                resultObj.description = gbInfo.description;
              }
              resultObj.overall_confidence_score = 1.0;
              resultObj.requires_manual_confirmation = false;
            }
          }
        }
      } catch (gbErr) {
        console.warn('[Google Books Enrichment Skip]:', gbErr);
      }
    }

    // Map downward compatibility properties for old/existing client-side configurations
    resultObj.confidence = resultObj.overall_confidence_score ?? 0.85;
    resultObj.needVerification = resultObj.requires_manual_confirmation ?? false;

    // Return successful payload with both result and data handles
    res.json({ success: true, result: resultObj, data: resultObj });

  } catch (error: any) {
    const errMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || '');
    console.warn(`[Gemini OCR API] API Catch Error: ${errMsg.slice(0, 150)}...`);
    
    const isPermanent = errMsg.includes('PERMISSION_DENIED') || 
                        errMsg.includes('403') || 
                        errMsg.includes('QUOTA_EXHAUSTED') || 
                        errMsg.includes('429') || 
                        errMsg.includes('denied');
    
    if (isPermanent) {
      console.info(`[Gemini API Permanent Error - Calling client fallback]: Bypassing retry due to restricted access.`);
      res.json({
        success: true,
        useClientOcrFallback: true,
        message: `GCP Project restriction or quota reached. Smoothly defaulting to client-side OCR engine...`
      });
      return;
    }

    // Defaulting to client OCR fallback
    console.info('[Gemini API - All attempts failed. Defaulting to client OCR fallback]');
    res.json({ 
      success: true,
      useClientOcrFallback: true,
      message: 'Failed to analyze book cover via Gemini. Smoothly defaulting to client-side OCR engine...'
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
