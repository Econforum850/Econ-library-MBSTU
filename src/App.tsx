import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import Events from './pages/Events';
import Shop from './pages/Shop';
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

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="books" element={<Books />} />
            <Route path="events" element={<Events />} />
            <Route path="shop" element={<Shop />} />
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
            <Route path="stickers" element={<div className="p-8"><h1 className="text-2xl font-black">Stickers & QR</h1></div>} />
            <Route path="scanner" element={<div className="p-8"><h1 className="text-2xl font-black">Barcode Scanner</h1></div>} />
            <Route path="issues" element={<div className="p-8"><h1 className="text-2xl font-black">Issues & Returns</h1></div>} />
            <Route path="shop" element={<div className="p-8"><h1 className="text-2xl font-black">Shop Management</h1></div>} />
            <Route path="orders" element={<div className="p-8"><h1 className="text-2xl font-black">Book Orders</h1></div>} />
            <Route path="dues" element={<div className="p-8"><h1 className="text-2xl font-black">Member Dues</h1></div>} />
            <Route path="donors" element={<div className="p-8"><h1 className="text-2xl font-black">Donors List</h1></div>} />
            <Route path="finances" element={<AdminFinances />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
