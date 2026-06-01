import { 
  Settings as SettingsIcon, Globe, Shield, 
  Bell, Image, BookOpen, MessageSquare, 
  Trash2, Plus, Save, ToggleRight,
  Lock, Users, Layout, FileText, Database,
  ExternalLink, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useState } from 'react';

const settingsSections = [
  { id: 'general', label: 'ইভেন্ট তৈরি ও পরিচালনা', icon: Globe, desc: 'নতুন ইভেন্ট তৈরি করুন, আপডেট বা মুছে ফেলুন।' },
  { id: 'blog', label: 'বুক রিভিউ ও ব্লগ', icon: FileText, desc: 'সদস্যদের ব্লগ এবং বুক রিভিউ পরিচালনা করুন।' },
  { id: 'management', label: 'পরিচালনা পর্ষদ', icon: Users, desc: 'টিম মেম্বার এবং কার্যনির্বাহী পরিষদ পরিচালনা করুন।' },
  { id: 'config', label: 'গঠনতন্ত্র সেটিংস', icon: SettingsIcon, desc: 'পাঠাগারের গঠনতন্ত্র এবং নীতিসমূহ আপডেট করুন।' },
  { id: 'notices', label: 'নোটিশ বোর্ড', icon: Bell, desc: 'সকল প্রকার নোটিশ আপডেট এবং আর্কাইভ করুন।' },
  { id: 'messages', label: 'মেসেজসমূহ', icon: MessageSquare, desc: 'ইউজারদের মেসেজ এবং চ্যাট হিস্ট্রি দেখুন।' },
  { id: 'reset', label: 'রিসেট রিকুয়েস্ট', icon: Lock, desc: 'পাসওয়ার্ড এবং ইনফরমেশন রিসেট রিকুয়েস্ট ম্যানেজ করুন।' },
  { id: 'requests', label: 'বইয়ের অনুরোধ রিকুয়েস্ট', icon: BookOpen, desc: 'ইউজারদের নতুন বইয়ের অনুরোধগুলো দেখুন।' },
];

export default function AdminSettings() {
  const [urls, setUrls] = useState({
    inventory: localStorage.getItem('sheet_inventory') || import.meta.env.VITE_GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRfFFE_8E7kQVRGRXuN_HZDMFQWZvfhxnVU7SI0sZi8mCp2am8qsa5eNeT6WYVkF8kQdza8eWcYWk07/pub?output=csv',
    members: localStorage.getItem('sheet_members') || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjbvT42nJIt_6goEZeYH0vzeACzf6tmANoUJeUTFpSBIJzrbQJ7xMZwlTZ5g7KJiPDYR1gdjWVdfNt/pub?output=csv',
    registrationScript: localStorage.getItem('registration_script_url') || 'https://script.google.com/macros/s/AKfycbx8JvVk5nvS7XO6jXPwHb9BhCbaNUBgTxycqI1NguV_LoixqY4xYfVbZF6hTvpbo4Dfug/exec',
    donorMediaLink: localStorage.getItem('donor_media_link') || '',
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveUrls = () => {
    localStorage.setItem('sheet_inventory', urls.inventory);
    localStorage.setItem('sheet_members', urls.members);
    localStorage.setItem('registration_script_url', urls.registrationScript);
    localStorage.setItem('custom_sheet_url', urls.inventory);
    localStorage.setItem('donor_media_link', urls.donorMediaLink);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    alert('প্রয়োজনীয় গুগল শিট ও স্ক্রিপ্ট লিঙ্ক সেভ হয়েছে! পরিবর্তন দেখতে পেজ রিফ্রেশ করুন।');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ওয়েবসাইট সেটিংস</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">ওয়েবসাইটের বিভিন্ন কনফিগারেশন এবং ইভেন্ট পরিচালনা করুন।</p>
        </div>
        <button 
          onClick={handleSaveUrls}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black flex items-center space-x-3 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          <span>সব সেভ করুন</span>
        </button>
      </div>

      {/* Multi-Sheet Config */}
      <div className="bg-white p-10 rounded-[48px] border border-indigo-100 shadow-lg shadow-indigo-50/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex items-center space-x-6 mb-10 relative z-10">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-indigo-200">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">গুগল শিট কানেকশন (Module Based)</h3>
            <p className="text-sm font-bold text-slate-400">প্রতিটি মডিউলের জন্য আলাদা আলাদা শিট কানেক্ট করুন।</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-6">বইয়ের তালিকা (Inventory) 📖</label>
              <input 
                type="text" 
                value={urls.inventory}
                onChange={(e) => setUrls({...urls, inventory: e.target.value})}
                placeholder="CSV URL..."
                className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-6">সদস্য ব্যবস্থাপনা (Members) 👥</label>
              <input 
                type="text" 
                value={urls.members}
                onChange={(e) => setUrls({...urls, members: e.target.value})}
                placeholder="CSV URL..."
                className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-6">নিবন্ধন স্ক্রিপ্ট (Registration Script) ⚙️</label>
              <input 
                type="text" 
                value={urls.registrationScript}
                onChange={(e) => setUrls({...urls, registrationScript: e.target.value})}
                placeholder="Google Apps Script URL..."
                className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-6">দাতা ড্রাইভ মেমোরি ফোল্ডার লিঙ্ক 📁</label>
              <input 
                type="text" 
                value={urls.donorMediaLink}
                onChange={(e) => setUrls({...urls, donorMediaLink: e.target.value})}
                placeholder="Google Drive Folder Link..."
                className="w-full px-8 py-4 bg-slate-50 border border-amber-100 rounded-3xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-amber-50"
              />
            </div>
            <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100">
               <h4 className="text-[10px] font-black text-emerald-950 mb-1.5 uppercase tracking-widest">কিভাবে কানেক্ট করবেন?</h4>
               <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                 ১. গুগল শিটে File &gt; Share &gt; Publish to web এ যান।<br/>
                 ২. CSV ফরম্যাট সিলেক্ট করে লিঙ্কটি কপি করুন।<br/>
                 ৩. এখানে সঠিক বক্সে পেস্ট করে নিচে "সব সেভ করুন" প্রেস করুন।
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            className="group bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <section.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">{section.label}</h3>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed line-clamp-2">
              {section.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Image className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">ইভেন্ট ফটো কার্ড</h3>
          </div>
          <div className="border-4 border-dashed border-slate-50 rounded-[40px] p-12 text-center group hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
             <Plus className="w-10 h-10 text-indigo-200 mx-auto mb-4" />
             <p className="text-sm font-bold text-slate-400">ছবি সিলেক্ট করুন</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] border border-emerald-100 shadow-sm">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">সাব-অ্যাডমিন পারমিশন</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {["Inventory", "Users", "Issues", "Finances"].map(p => (
               <div key={p} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl">
                 <div className="w-4 h-4 bg-white border border-slate-200 rounded" />
                 <span className="text-xs font-bold text-slate-600">{p}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
