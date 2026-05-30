import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import Events from './pages/Events';
import Donors from './pages/Donors';
import Account from './pages/Account';
import Login from './pages/Login';
import Register from './pages/Register';

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
import AdminEvents from './pages/admin/Events';
import AdminScanner from './pages/admin/Scanner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="books" element={<Books />} />
          <Route path="events" element={<Events />} />
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
          <Route path="scanner" element={<AdminScanner />} />
          <Route path="issues" element={<AdminIssues />} />
          <Route path="shop" element={<AdminShop />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="dues" element={<AdminDues />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
