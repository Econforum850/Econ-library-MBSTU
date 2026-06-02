import { useState, useEffect } from 'react';
import { 
  Crown, Heart, Search, Filter, Plus, Edit2, Trash2,
  RefreshCw, Loader2, User as UserIcon, Building2,
  CheckCircle2, DollarSign, ArrowRight, X, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db, SupabaseDonor as SheetDonor } from '@/src/lib/supabaseDatabase';

export default function AdminDonors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [donors, setDonors] = useState<SheetDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingSheet, setIsUsingSheet] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<SheetDonor | null>(null);

  // Field Values
  const [name, setName] = useState('');
  const [type, setType] = useState<'Individual' | 'Organization'>('Individual');
  const [totalDonation, setTotalDonation] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [impact, setImpact] = useState('');
  const [description, setDescription] = useState('');

  const formatDisplayDateNum = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('bn-BD');
        }
      }
    } catch (e) {}
    return dateStr;
  };

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

  const openAddModal = () => {
    setEditingDonor(null);
    setName('');
    setType('Individual');
    setTotalDonation('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setLastDonationDate(`${yyyy}-${mm}-${dd}`);
    setImpact('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (donor: SheetDonor) => {
    setEditingDonor(donor);
    setName(donor.name);
    setType(donor.type);
    setTotalDonation(donor.totalDonation);
    setLastDonationDate(donor.lastDonationDate);
    setImpact(donor.impact);
    setDescription(donor.description);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই দাতা সদস্যের রেকর্ডটি মুছে ফেলতে চান?')) {
      try {
        setLoading(true);
        await db.deleteDonor(id);
        await loadDonors();
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalDonation) {
      alert('দয়া করে নাম এবং দানের পরিমাণ পূরণ করুন!');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<SheetDonor> = {
        name,
        type,
        totalDonation,
        lastDonationDate: lastDonationDate || new Date().toLocaleDateString('bn-BD'),
        impact,
        description
      };

      if (editingDonor) {
        payload.id = editingDonor.id;
      }

      await db.saveDonor(payload);
      setIsModalOpen(false);
      await loadDonors();
    } catch (err) {
      console.error('Donor save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.impact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">দাতা সদস্য তালিকা (Donors)</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm font-bold text-slate-400">মোট {donors.length} জন দাতা</p>
            {isUsingSheet && (
              <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-110">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                লাইভ ডেটাবেইজ
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={openAddModal}
            className="flex items-center space-x-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন দাতা সদস্য যোগ করুন</span>
          </button>
          <button 
            onClick={loadDonors}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading && donors.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="relative w-full md:w-96 mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="দাতার নাম, স্থান বা অবদান খুঁজুন..." 
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
                  <th className="px-8 py-5">শেষ তারিখ</th>
                  <th className="px-8 py-5 text-right">সম্পাদন</th>
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
                        {donor.type === 'Organization' ? 'প্রতিষ্ঠান' : 'ব্যক্তিগত'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-slate-600 font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-400" />
                        {donor.impact}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-emerald-600 font-black text-lg">{donor.totalDonation}</td>
                    <td className="px-8 py-6 text-slate-400 font-bold">{formatDisplayDateNum(donor.lastDonationDate)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(donor)}
                          className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all text-indigo-600"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(donor.id)}
                          className="p-3 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all text-rose-600"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">
                {editingDonor ? 'দাতা সদস্য সম্পাদন 📝' : 'নতুন দাতা সদস্য যোগ করুন 👑'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">দাতা সদস্যের নাম *</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: প্রফেসর ড. সৈয়দ কামরুল আহসান টিটু"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">দাতার ধরন</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setType('Individual')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-sm border transition-all",
                      type === 'Individual' ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    ব্যক্তিগত (Individual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Organization')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-sm border transition-all",
                      type === 'Organization' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    প্রতিষ্ঠান (Organization)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">মোট অবদান (দান) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="যেমন: ৳১০,০০০"
                    value={totalDonation}
                    onChange={(e) => setTotalDonation(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">শেষ প্রদানের তারিখ</label>
                  <input 
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">অবদানের বিবরণ (Impact)</label>
                <input 
                  type="text"
                  placeholder="যেমন: ২৫টি একাডেমিক বই উপহার, বুকশেলফ নির্মাণ"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">পরিচিতি/ঠিকানা (Description)</label>
                <input 
                  type="text"
                  placeholder="যেমন: অর্থনীতি বিভাগ, জাহাঙ্গীরনগর বিশ্ববিদ্যালয়"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
