import { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ override: true });

function getTransporter() {
  const user = (process.env.GMAIL_USER || 'eco24034@mbstu.ac.bd').trim();
  let pass = process.env.GMAIL_APP_PASSWORD;
  
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
    const transporter = getTransporter();
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
