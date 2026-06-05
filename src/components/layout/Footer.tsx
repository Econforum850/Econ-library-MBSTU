import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import logoGold from '@/src/assets/images/logo_gold.png';

export default function Footer() {
  return (
    <footer className="bg-transparent py-16 mt-20 relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Elegant Floating White Card matching the user's brand structure exactly */}
        <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-200/80 shadow-[0_10px_45px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Brand section */}
            <div className="space-y-6 text-left">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shadow-md shadow-slate-100 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 overflow-hidden border border-slate-200/50 bg-[#060b18]">
                  <img src={logoGold} alt="Econ Library Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 leading-tight">ইকোলাইব্রেরি</span>
                  <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">ECONOMICS MBSTU</span>
                </div>
              </Link>
              <p className="text-sm text-slate-600 leading-relaxed font-semibold max-w-xs">
                ব্যতিক্রমী ডিজিটাল পাঠাগার যা সবার জন্য উন্মুক্ত। আপনাদের সহযোগিতা আমাদের শক্তি। 
              </p>
            </div>

            {/* Links section with crimson highlight catalog trigger */}
            <div className="text-left">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-6 border-b border-slate-100 pb-3">দ্রুত সংযোগ</h3>
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/books" 
                    className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg hover:scale-103 transition-all border border-red-500/20"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    বইয়ের ক্যাটালগ
                  </Link>
                </li>
                <li>
                  <Link to="/donors" className="text-sm font-bold text-slate-600 hover:text-[#352df2] transition-colors inline-block">
                    दाता सदस्य सूची / দাতা সদস্য তালিকা
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-sm font-bold text-slate-600 hover:text-[#352df2] transition-colors inline-block">
                    ইভেন্ট ও নোটিশ
                  </Link>
                </li>
                <li>
                  <Link to="/membership" className="text-sm font-bold text-slate-600 hover:text-[#352df2] transition-colors inline-block">
                    মেম্বারশিপ গাইডলাইন ও নিয়ম
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm font-bold text-slate-600 hover:text-[#352df2] transition-colors inline-block">
                    যোগাযোগ এবং ফিডব্যাক
                  </Link>
                </li>
                <li className="pt-2 border-t border-dashed border-slate-100">
                  <Link 
                    to="/admin/login" 
                    className="text-xs font-black text-slate-500 hover:text-[#352df2] tracking-wider transition-colors inline-flex items-center gap-1.5 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100"
                  >
                    🛡️ মডারেটর ও অ্যাডমিন পোর্টাল
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact section with custom icon badges */}
            <div className="text-left">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Contact Information</h3>
              <ul className="space-y-4">
                <li className="text-sm text-slate-600 leading-relaxed">
                  <span className="block font-black text-slate-900 mb-0.5">ঠিকানা:</span>
                  6th Floor, 3rd academic building, MBSTU<br />
                  Santosh, Tangail, 1902
                </li>
                <li className="text-sm text-slate-650 flex items-center space-x-2">
                  <span className="font-bold text-slate-900">WhatsApp:</span> 
                  <a href="tel:01880412129" className="hover:text-[#352df2] text-slate-600 font-semibold underline">01880412129</a>
                </li>
                <li className="text-sm text-slate-650 flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Email:</span> 
                  <a href="mailto:eco24034@mbstu.ac.bd" className="hover:text-[#352df2] text-slate-600 font-semibold underline">eco24034@mbstu.ac.bd</a>
                </li>
                <li className="pt-1">
                  <a 
                    href="https://wa.me/8801880412129" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center space-x-1 text-sm text-[#352df2] hover:text-[#2018da] font-black underline transition-all hover:translate-x-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span>Click to Chat →</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Map section */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-6 border-b border-slate-100 pb-3">লোকেশন ম্যাপ</h3>
              <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3639.2434543788!2d89.89069531500003!3d24.232356584353457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fdfbdd6c703b37%3A0x6739b60da423cf44!2sDepartment%20of%2520Economics%252C%2520MBSTU!5e0!3m2!1sen!2sbd!4v1652550000000!5m2!1sen!2sbd" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale-20 group-hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>
              <a 
                href="https://maps.app.goo.gl/5FUpsPgY1R1rnWx77" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-[10px] font-black text-slate-500 hover:text-[#352df2] transition-colors uppercase tracking-widest mt-1"
              >
                <span>গুগল ম্যাপে দেখুন</span>
                <BookOpen className="w-3 h-3 ml-1.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Gray Copyright Section Sitting Directly count bottom */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-extrabold px-4">
          <p>© 2026 Econ-library-MBSTU সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/admin/login" className="hover:text-[#352df2] text-slate-500 transition-colors">অ্যাডমিন প্রবেশদ্বার</Link>
            <a href="#" className="hover:text-[#352df2] text-slate-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#352df2] text-slate-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
