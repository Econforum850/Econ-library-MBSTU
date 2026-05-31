import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import logoGold from '@/src/assets/images/logo_gold.png';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand section */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shadow-xl shadow-slate-100 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 overflow-hidden border border-slate-100 bg-white">
                <img src={logoGold} alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900 leading-tight">ইকোলাইব্রেরি</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ECONOMICS MBSTU</span>
              </div>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-medium">
              ব্যতিক্রমী ডিজিটাল পাঠাগার যা সবার জন্য উন্মুক্ত। আপনাদের সহযোগিতা আমাদের শক্তি। 
            </p>
          </div>

          {/* Links section */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">দ্রুত সংযোগ</h3>
            <ul className="space-y-5">
              <li>
                <Link 
                  to="/books" 
                  className="inline-flex items-center px-6 py-3 bg-[#b40000] text-white text-xs font-black rounded-xl shadow-xl shadow-red-100 hover:scale-105 transition-all"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  বইয়ের ক্যাটালগ
                </Link>
              </li>
              <li><Link to="/donors" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors inline-block ml-1">দাতা সদস্যগণের তালিকা</Link></li>
              <li><Link to="/events" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors inline-block ml-1">ইভেন্ট ও নোটিশ</Link></li>
              <li><Link to="/admin/login" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors inline-block ml-1 italic">অ্যাডমিন পোর্টাল</Link></li>
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

          {/* Map section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">লোকেশন ম্যাপ</h3>
            <div className="w-full h-40 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3639.2434543788!2d89.89069531500003!3d24.232356584353457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fdfbdd6c703b37%3A0x6739b60da423cf44!2sDepartment%20of%20Economics%2C%20MBSTU!5e0!3m2!1sen!2sbd!4v1652550000000!5m2!1sen!2sbd" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
              ></iframe>
            </div>
            <a 
              href="https://maps.app.goo.gl/5FUpsPgY1R1rnWx77" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-[10px] font-black text-indigo-600 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              <span>গুগল ম্যাপে দেখুন</span>
              <BookOpen className="w-3 h-3 ml-2" />
            </a>
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
