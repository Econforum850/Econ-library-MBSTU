import { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Load environment variables from .env file
dotenv.config({ override: true });

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

async function getTransporter() {
  let user = (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim();
  let pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!pass) {
    console.log('[SMTP Test API] GMAIL_APP_PASSWORD is blank. Attempting Firestore DB credentials fallback.');
    const dbSettings = await getSMTPSettingsFromFirestore();
    if (dbSettings && dbSettings.gmailAppPassword) {
      if (dbSettings.gmailUser) {
        user = dbSettings.gmailUser.trim();
      }
      pass = dbSettings.gmailAppPassword.trim();
      console.log('[SMTP Test API] Loaded credentials from Firestore successfully.');
    }
  }

  if (!pass) {
    throw new Error('Gmail SMTP Configuration Error: GMAIL_APP_PASSWORD environment variable is missing or empty. Please create an App Password in your Google Account Security settings.');
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

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (code: number) => any; json: (data: any) => any }) {
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

  try {
    const transporter = await getTransporter();
    await transporter.verify();
    res.status(200);
    res.json({
      success: true,
      message: 'SMTP connection successfully established with Gmail!',
      user: (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim()
    });
  } catch (err: any) {
    console.error('SMTP verification failed on serverless handler:', err);
    res.status(200); // We return status 200 so our frontend's try-catch works smoothly and gets the JSON payload with error description
    res.json({
      success: false,
      message: 'SMTP verification failed',
      error: err.message,
      stack: err.stack,
      user: (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim()
    });
  }
}
