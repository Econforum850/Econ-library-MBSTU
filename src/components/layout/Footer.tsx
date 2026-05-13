import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">L</div>
              <span className="text-xl font-bold text-slate-900 leading-tight">Econ-library-MBSTU</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              এটি একটি আধুনিক ডিজিটাল পাঠাগার যা সবার জন্য উন্মুক্ত। আপনাদের একটি ছোট উপহার বা আর্থিক অনুদান আমাদের পাঠাগারকে আরও সুসংগঠিত করতে পারে।
            </p>
          </div>

          {/* Links section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Links</h3>
            <ul className="space-y-4">
              <li><Link to="/books" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Books Catalog</Link></li>
              <li><Link to="/donors" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Donors Wall</Link></li>
              <li><Link to="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Blog & News</Link></li>
              <li><Link to="/login" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Admin Portal (Login)</Link></li>
            </ul>
          </div>

          {/* Contact section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="text-sm text-slate-600 leading-relaxed">
                <span className="block font-semibold decoration-indigo-200">ঠিকানা:</span>
                6th Floor, 3rd academic building, MBSTU<br />
                Santosh, Tangail, 1902
              </li>
              <li className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900 mr-2">WhatsApp:</span> 
                <a href="tel:01880412129" className="hover:text-indigo-600">01880412129</a>
              </li>
              <li className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900 mr-2">Email:</span> 
                <a href="mailto:eco24034@mbstu.ac.bd" className="hover:text-indigo-600 underline">eco24034@mbstu.ac.bd</a>
              </li>
              <li>
                <a href="https://wa.me/8801880412129" target="_blank" rel="noreferrer" className="text-sm text-indigo-600 font-bold flex items-center hover:translate-x-1 transition-transform">
                  Click to Chat →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 font-medium">
          <p>© 2026 Econ-library-MBSTU সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
