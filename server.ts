import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup nodemailer transporter bound to Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eeconlibrary.mbstu@gmail.com',
    // In production, users should configure a secret App Password.
    // We will supply the direct password as requested fallback.
    pass: process.env.GMAIL_APP_PASSWORD || 'eeconlibrary.mbstu@gmail.com@#'
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
    const mailOptions: any = {
      from: '"MBSTU Econ Library & Organisation" <eeconlibrary.mbstu@gmail.com>',
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Email dispatched successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Core Email sending module error:', err);
    res.status(500).json({ 
      error: 'SMTP mail transmission failed.', 
      details: err.message,
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
