import { useState, useEffect } from 'react';
import { 
  Crown, Heart, Search, Filter, 
  RefreshCw, Loader2, User as UserIcon, Building2,
  CheckCircle2, DollarSign, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseDonor as SheetDonor } from '@/src/lib/supabaseDatabase';

const initialDonors: SheetDonor[] = [
  { id: '1', name: 'প্রফেসর ড. সৈয়দ কামরুল আহসান টিটু', type: 'Individual', totalDonation: '৳৫০০০', lastDonationDate: '10 May 2024', impact: 'বুক শেলফ', description: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়' },
  { id: '2', name: 'পানধোয়া গ্রীন সিটি লিমিটেড', type: 'Organization', totalDonation: '৳২৫০০০', lastDonationDate: '01 May 2024', impact: 'রিনোভেশন', description: 'কর্পোরেট অনুদান' },
];

export default function AdminDonors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [donors, setDonors] = useState<SheetDonor[]>(initialDonors);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);

  const loadDonors = async () => {
    try {
      setLoading(true);
      const fetched = await db.getDonors();
      setDonors(fetched);
      const isLive = await db.isSupabaseConnected();
      setIsUsingSheet(isLive);
    } catch (err) {
      console.error('Donors fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, []);

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.impact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">দাতা সদস্য তালিকা</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {donors.length} জন দাতা</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ শিট
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={loadDonors}
          disabled={loading}
          className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full md:w-96 mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="দাতার নাম খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">দাতা (Donor)</th>
                <th className="px-8 py-5">ধরন</th>
                <th className="px-8 py-5">প্রভাব/অবদান (Impact)</th>
                <th className="px-8 py-5">মোট দান</th>
                <th className="px-8 py-5 text-right">শেষ তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredDonors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-black text-lg border border-amber-100 shadow-sm group-hover:scale-110 transition-transform">
                        {donor.type === 'Organization' ? <Building2 className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <Link 
                          to={`/admin/users?search=${encodeURIComponent(donor.name)}`}
                          className="font-black text-slate-900 line-clamp-1 hover:text-indigo-600 transition-colors flex items-center group/link"
                        >
                          {donor.name}
                          <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-indigo-400" />
                        </Link>
                        <p className="text-[10px] font-bold text-slate-400">{donor.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                      donor.type === 'Organization' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {donor.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-slate-600 font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-400" />
                      {donor.impact}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-emerald-600 font-black text-lg">{donor.totalDonation}</td>
                  <td className="px-8 py-6 text-right text-slate-400 font-bold">{donor.lastDonationDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
