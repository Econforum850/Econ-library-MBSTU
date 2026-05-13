import { 
  User, Mail, Phone, MapPin, 
  Shield, Edit3, Camera, 
  Settings, Key, Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const navigate = useNavigate();
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative group">
        <div className="h-48 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[#000] opacity-10" />
          <button className="absolute top-6 right-6 p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 text-white transition-all group/btn">
            <Edit3 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="px-10 pb-10">
          <div className="relative -mt-20 mb-8 flex items-end space-x-6">
            <div className="relative group/avatar">
              <div className="w-32 h-32 rounded-[32px] border-8 border-white bg-white shadow-xl overflow-hidden">
                <img src="https://placehold.co/200x200/4f46e5/white?text=Admin" alt="Admin" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white opacity-0 group-hover/avatar:opacity-100 transition-all scale-75 group-hover/avatar:scale-100">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-black text-slate-900 leading-tight">System Admin</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Super Administrator</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
                   <User className="w-5 h-5 mr-3 text-indigo-500" />
                   ব্যক্তিগত তথ্য
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ইমেইল ঠিকানা</p>
                    <p className="font-bold text-slate-700">admin@library.com</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ফোন নম্বর</p>
                    <p className="font-bold text-slate-700">+৮৮০ ১৭০০-০০০০০০</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ঠিকানা</p>
                    <p className="font-bold text-slate-700">পানধোয়া, সাভার, ঢাকা</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
                   <Shield className="w-5 h-5 mr-3 text-indigo-500" />
                   নিরাপত্তা ও সেটিংস
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-3xl hover:border-indigo-600 transition-all group">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Key className="w-5 h-5" />
                      </div>
                      <span className="font-black text-slate-700">পাসওয়ার্ড পরিবর্তন</span>
                    </div>
                  </button>
                  <button className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-3xl hover:border-indigo-600 transition-all group">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mr-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                      </div>
                      <span className="font-black text-slate-700">নোটিফিকেশন সেটিং</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100 relative group overflow-hidden">
                <Settings className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-100 group-hover:rotate-45 transition-transform duration-1000" />
                <h4 className="text-indigo-900 font-black mb-2 relative z-10">সিস্টেম প্রিফারেন্স</h4>
                <p className="text-indigo-600 text-xs font-bold relative z-10">আপনার অ্যাডমিন অভিজ্ঞতা কাস্টমাইজ করুন এবং সিস্টেম প্যারামিটারগুলি পরিচালনা করুন।</p>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="mt-6 px-6 py-3 bg-white text-indigo-600 text-xs font-black rounded-xl shadow-sm hover:shadow-lg transition-all relative z-10"
                >
                   ম্যানেজ সেটিংস
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
