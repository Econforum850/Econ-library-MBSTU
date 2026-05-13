import { useState } from 'react';
import { 
  Users as UsersIcon, Search, Filter, 
  MoreVertical, UserPlus, Mail, Phone,
  CheckCircle2, XCircle, Shield, Trash2,
  Edit2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const members = [
  { id: 'M-101', name: 'Tanvir Ahmed', email: 'tanvir@example.com', phone: '01712xxxxxx', role: 'Premium', status: 'Active', joined: '12 May 2024' },
  { id: 'M-102', name: 'Alif Khan', email: 'alif@example.com', phone: '01854xxxxxx', role: 'Basic', status: 'Active', joined: '15 May 2024' },
  { id: 'M-103', name: 'Sabbir Hossain', email: 'sabbir@example.com', phone: '01923xxxxxx', role: 'Premium', status: 'Inactive', joined: '01 April 2024' },
];

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সদস্য ব্যবস্থাপনা</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">মোট {members.length} জন নিবন্ধিত সদস্য</p>
        </div>
        <button className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <UserPlus className="w-5 h-5" />
          <span>নতুন সদস্য যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="সদস্যের নাম বা আইডি খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center space-x-3">
             <button className="flex items-center space-x-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
               <Filter className="w-4 h-4" />
               <span>ফিল্টার</span>
             </button>
             <button className="px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-100 transition-all uppercase tracking-wider">
               Export CSV
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">সদস্য (Member)</th>
                <th className="px-8 py-5">বিস্তারিত</th>
                <th className="px-8 py-5">স্ট্যাটাস</th>
                <th className="px-8 py-5">ভূমিকা</th>
                <th className="px-8 py-5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{member.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full inline-block mt-1">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-500 font-bold text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.email}
                      </div>
                      <div className="flex items-center text-slate-400 font-bold text-[10px]">
                        <Phone className="w-3.5 h-3.5 mr-2 opacity-50" /> {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      member.status === 'Active' 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-slate-600 font-black">
                      <Shield className="w-4 h-4 mr-2 text-indigo-400" />
                      {member.role}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-indigo-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-rose-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-slate-900">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">Showing 1 to 3 of 30 entries</p>
          <div className="flex items-center space-x-2">
            <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-5 py-2.5 bg-indigo-600 border border-indigo-600 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-100">1</button>
            <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">2</button>
            <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
