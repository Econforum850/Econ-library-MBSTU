import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import Events from './pages/Events';
import Donors from './pages/Donors';
import Account from './pages/Account';
import Login from './pages/Login';
import Register from './pages/Register';
import { CartProvider } from './lib/cart';

import Cart from './pages/Cart';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminInventory from './pages/admin/Inventory';
import AdminFinances from './pages/admin/Finances';
import AdminProfile from './pages/admin/Profile';
import AdminSettings from './pages/admin/Settings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminIssues from './pages/admin/Issues';
import AdminDonors from './pages/admin/Donors';
import AdminShop from './pages/admin/Shop';
import AdminOrders from './pages/admin/Orders';
import AdminStickers from './pages/admin/Stickers';
import AdminDues from './pages/admin/Dues';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="books" element={<Books />} />
            <Route path="events" element={<Events />} />
            <Route path="cart" element={<Cart />} />
            <Route path="donors" element={<Donors />} />
            <Route path="account" element={<Account />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="stickers" element={<AdminStickers />} />
            <Route path="scanner" element={<div className="p-8"><h1 className="text-4xl font-black mb-8">বারকোড স্ক্যানার</h1><div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold italic">ক্যামেরা এক্সেস প্রয়োজন...</div></div>} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="shop" element={<AdminShop />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="dues" element={<AdminDues />} />
            <Route path="donors" element={<AdminDonors />} />
            <Route path="finances" element={<AdminFinances />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
