import { 
  Settings as SettingsIcon, Globe, Shield, 
  Bell, Image, BookOpen, MessageSquare, 
  Trash2, Plus, Save, ToggleRight,
  Lock, Users, Layout, FileText
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
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ওয়েবসাইট সেটিংস</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">ওয়েবসাইটের বিভিন্ন কনফিগারেশন এবং ইভেন্ট পরিচালনা করুন।</p>
        </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            className="group bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all text-left"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <section.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2 truncate">{section.label}</h3>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed line-clamp-2">
              {section.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Card Section */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Image className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">ইভেন্ট ফটো কার্ড</h3>
          </div>
          
          <div className="border-4 border-dashed border-slate-50 rounded-[40px] p-12 text-center group hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
            <input type="file" className="hidden" id="event-upload" />
            <label htmlFor="event-upload" className="cursor-pointer">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Plus className="w-10 h-10" />
              </div>
              <p className="text-lg font-black text-slate-900 mb-2">ছবি সিলেক্ট করুন</p>
              <p className="text-xs font-bold text-slate-400">(MAX: 2MB, Format: JPG/PNG)</p>
            </label>
          </div>

          <button className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[28px] font-black flex items-center justify-center space-x-3 hover:bg-indigo-600 transition-all group shadow-xl shadow-indigo-100">
            <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>সেটিং সেট করুন</span>
          </button>
        </div>

        {/* Sub-Admin Permissions */}
        <div className="bg-white p-10 rounded-[48px] border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center space-x-4 mb-8 relative z-10">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">সাব-অ্যাডমিন ওয়েব এক্সপ্রেস</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {[
              "সদস্য ব্যবস্থাপনা", "বইয়ের তালিকা", "ইস্যু ও ফেরত", "সদস্যদের বকেয়া",
              "দাতা সদস্য", "হিসাব-নিকাশ", "নোটিশ", "মেসেজসমূহ",
              "বইয়ের অনুরোধ", "প্রি-বুকিং", "শপ বই ব্যবস্থাপনা", "বই বিক্রয় অর্ডার"
            ].map((perm) => (
              <label key={perm} className="flex items-center space-x-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-emerald-500 transition-all group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs font-black text-slate-600 group-hover:text-emerald-700">{perm}</span>
              </label>
            ))}
          </div>

          <button className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[28px] font-black flex items-center justify-center space-x-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
            <Save className="w-5 h-5" />
            <span>সেটিং সেট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
