import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock API for Users
  app.get("/api/admin/users", (req, res) => {
    res.json([
      { id: 'M-101', name: 'Tanvir Ahmed', email: 'tanvir@example.com', phone: '01712xxxxxx', role: 'Premium', status: 'Active', joined: '12 May 2024' },
      { id: 'M-102', name: 'Alif Khan', email: 'alif@example.com', phone: '01854xxxxxx', role: 'Basic', status: 'Active', joined: '15 May 2024' },
      { id: 'M-103', name: 'Sabbir Hossain', email: 'sabbir@example.com', phone: '01923xxxxxx', role: 'Premium', status: 'Inactive', joined: '01 April 2024' },
    ]);
  });

  // Mock API for Inventory
  app.get("/api/admin/books", (req, res) => {
    res.json([
      { id: 'B-1001', title: 'বিদ্রোহী', author: 'কাজী নজরুল ইসলাম', category: 'কবিতা', stock: 5, status: 'Available', price: '৳১২০' },
      { id: 'B-1002', title: 'গীতাঞ্জলি', author: 'রবীন্দ্রনাথ ঠাকুর', category: 'কবিতা', stock: 2, status: 'Available', price: '৳১৫০' },
      { id: 'B-1003', title: 'পথের পাঁচালী', author: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়', category: 'উপন্যাস', stock: 0, status: 'Lent Out', price: '৳১৮০' },
      { id: 'B-1004', title: 'মা', author: 'মাক্সিম গোর্কি', category: 'উপন্যাস', stock: 12, status: 'Available', price: '৳২৫০' },
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
