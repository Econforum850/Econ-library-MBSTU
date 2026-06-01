import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, ShieldAlert, Key, Mail, Trash2, ShieldX, CheckCircle, 
  User, RefreshCw, Eye, EyeOff, Search, Clock, ShieldCheck, PlayCircle
} from 'lucide-react';
import { db, SupabaseSubAdmin, SupabaseAuditLog } from '@/src/lib/supabaseDatabase';
import { getCurrentAdminUser } from '@/src/lib/adminAuth';

export default function SubAdmins() {
  const [subAdmins, setSubAdmins] = useState<SupabaseSubAdmin[]>([]);
  const [logs, setLogs] = useState<SupabaseAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'moderators' | 'audit_logs'>('moderators');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SupabaseSubAdmin | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Custom non-blocking confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const currentUser = getCurrentAdminUser();

  const loadData = async () => {
    setLoading(true);
    try {
      const accounts = await db.getSubAdmins();
      const auditTrail = await db.getAuditLogs();
      setSubAdmins(accounts);
      setLogs(auditTrail);
    } catch (err) {
      console.error('Error loading sub-admins/logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check permission - strictly enforce superadmin only
    if (currentUser.role !== 'super') {
      window.location.href = '/admin/dashboard';
      return;
    }
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingSubAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setStatus('active');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (sa: SupabaseSubAdmin) => {
    setEditingSubAdmin(sa);
    setName(sa.name);
    setEmail(sa.email);
    setPassword(sa.password || '');
    setStatus(sa.status);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleSaveSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPass = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPass) {
      setFormError('সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!');
      return;
    }

    if (trimmedPass.length < 5) {
      setFormError('পাসওয়ার্ড ন্যূনতম ৫ অক্ষরের হতে হবে।');
      return;
    }

    // Check if duplicate unless editing same
    const isDuplicate = subAdmins.some(
      (sa) => sa.email.toLowerCase() === trimmedEmail && (!editingSubAdmin || editingSubAdmin.id !== sa.id)
    );
    if (isDuplicate || trimmedEmail === 'eco24034@mbstu.ac.bd') {
      setFormError('এই ইমেইলটি ইতিমধ্যেই অ্যাডমিন হিসেবে তালিকাভুক্ত রয়েছে।');
      return;
    }

    try {
      const saData: Partial<SupabaseSubAdmin> = {
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPass,
        role: 'sub-admin',
        status: status,
      };

      if (editingSubAdmin) {
        saData.id = editingSubAdmin.id;
        saData.createdAt = editingSubAdmin.createdAt;
      }

      await db.saveSubAdmin(saData);
      
      const logAction = editingSubAdmin ? 'EDIT_SUBADMIN' : 'ADD_SUBADMIN';
      const logMsg = `${editingSubAdmin ? 'সম্পাদনা' : 'তৈরি'} করেছেন মডারেটর: ${trimmedName} (${trimmedEmail})`;
      await db.addAuditLog(logAction, logMsg);

      setShowFormModal(false);
      loadData();
    } catch (_) {
      setFormError('সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmState({
      show: true,
      title: 'মডারেটর অ্যাকাউন্ট মুছে ফেলুন',
      message: `আপনি কি নিশ্চিতভাবে "${name}" মডারেটর অ্যাকাউন্টটি মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।`,
      onConfirm: async () => {
        try {
          await db.deleteSubAdmin(id);
          await db.addAuditLog('DELETE_SUBADMIN', `মুছে ফেলা হয়েছে মডারেটর: ${name} (${id})`);
          setConfirmState(prev => ({ ...prev, show: false }));
          loadData();
        } catch (_) {
          setFormError('মুছে ফেলা ব্যর্থ হয়েছে।');
          setConfirmState(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleToggleStatus = (sa: SupabaseSubAdmin) => {
    const nextStatus = sa.status === 'active' ? 'suspended' : 'active';
    const actionText = nextStatus === 'active' ? 'সক্রিয়' : 'স্থগিত';
    setConfirmState({
      show: true,
      title: 'স্থিতি পরিবর্তন নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিতভাবে "${sa.name}" অ্যাকাউন্টটি ${actionText} করতে চান?`,
      onConfirm: async () => {
        try {
          await db.saveSubAdmin({ ...sa, status: nextStatus });
          await db.addAuditLog(
            nextStatus === 'active' ? 'ACTIVATE_SUBADMIN' : 'SUSPEND_SUBADMIN', 
            `স্থিতি পরিবর্তন (${actionText}): ${sa.name}`
          );
          setConfirmState(prev => ({ ...prev, show: false }));
          loadData();
        } catch (_) {
          setFormError('স্থিতি পরিবর্তন ব্যর্থ হয়েছে।');
          setConfirmState(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleClearAllLogs = () => {
    setConfirmState({
      show: true,
      title: 'অডিট ট্রেইল লগ পরিষ্কার করুন',
      message: 'আপনি কি নিশ্চিতভাবে সমস্ত সিস্টেম অ্যাক্টিভিটি এবং অডিট লগ মুছে ফেলতে চান? এই কাজের পর আগের সকল লগ চিরতরে মুছে যাবে।',
      onConfirm: async () => {
        try {
          await db.clearAuditLogs();
          await db.addAuditLog('CLEAR_AUDIT_LOG_SYSTEM', 'সুপার অ্যাডমিন কর্তৃক সম্পূর্ণ অডিট লগ ডাটাবেজ পরিষ্কার করা হয়েছে');
          setConfirmState(prev => ({ ...prev, show: false }));
          loadData();
        } catch (_) {
          setFormError('অডিট লগ পরিষ্কার করা ব্যর্থ হয়েছে।');
          setConfirmState(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const filteredAdmins = subAdmins.filter(
    (sa) =>
      sa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sa.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(
    (log) =>
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.adminId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.affectedRecordId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Intro Header banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-950 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden border border-indigo-800/20 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-[20%] -translate-y-[20%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-indigo-300 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN POWERHOUSE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight Bengali-font">মডারেটর ও নিরাপত্তা কন্ট্রোল প্যানেল</h2>
            <p className="text-sm font-semibold text-slate-300">
              এখানে আপনি সাব-অ্যাডমিন বা মডারেটর তৈরি ও নিয়ন্ত্রণ করতে পারবেন এবং সম্পূর্ণ অডিট ট্রেইল সিস্টেম অ্যাকশন দেখতে পাবেন।
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-4 bg-[#05d5a1] hover:bg-emerald-400 text-slate-950 hover:scale-105 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন মডারেটর তৈরি করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list & search block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start">
          <button
            onClick={() => { setActiveTab('moderators'); setSearchQuery(''); }}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'moderators' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            লাইব্রেরি মডারেটরগণ ({subAdmins.length})
          </button>
          <button
            onClick={() => { setActiveTab('audit_logs'); setSearchQuery(''); }}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'audit_logs' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            অডিট ট্রেইল লগ ও অ্যাকটিভিটি ({logs.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'moderators' ? 'নাম বা ইমেইল দিয়ে খুঁজুন...' : 'অ্যাকশন বা আইডি দিয়ে খুঁজুন...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-20 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-xs font-bold text-slate-500">ডাটা লোড হচ্ছে, অনুগ্রহপূর্বক অপেক্ষা করুন...</p>
        </div>
      ) : activeTab === 'moderators' ? (
        /* Moderators Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAdmins.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-[32px] border-2 border-dashed border-slate-200">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                <h4 className="text-sm font-black text-slate-800">কোনো মডারেটর অ্যাকাউন্ট পাওয়া যায়নি</h4>
                <p className="text-xs font-bold text-slate-400 mt-1">সবগুলো ক্ষমতা আপনার একার হাতেই। চাইলে উপরে ডানদিকের বাটন ক্লিক করে নতুন মডারেটর যুক্ত করুন।</p>
              </div>
            ) : (
              filteredAdmins.map((sa) => (
                <motion.div
                  key={sa.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[28px] border border-slate-150 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                        {sa.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        sa.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {sa.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-900">{sa.name}</h4>
                      <p className="text-xs text-slate-500 font-bold font-mono py-0.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sa.email}</span>
                      </p>
                      <div className="text-[10px] font-black text-slate-400 flex items-center gap-1 bg-slate-50 self-start px-2 py-0.5 rounded-lg mt-1 w-max">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>তৈরি: {new Date(sa.createdAt).toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>

                    {/* Permissions list */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">অনুমোদিত সুবিধাসমূহ (Permissions)</span>
                      <ul className="space-y-1.5">
                        <li className="text-[10px] font-bold text-slate-600 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>বই যোগ ও সম্পাদনা</span>
                        </li>
                        <li className="text-[10px] font-bold text-slate-600 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>সদস্য অনুমোদন ও ইস্যু/ফেরত</span>
                        </li>
                        <li className="text-[10px] font-bold text-slate-400 line-through decoration-rose-400 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>চিরতরে ডিলিট ও সেটিংস পরিবর্তন</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(sa)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-705 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      পাসওয়ার্ড পরিবর্তন
                    </button>
                    <button
                      onClick={() => handleToggleStatus(sa)}
                      title={sa.status === 'active' ? 'অ্যাকাউন্ট স্থগিত করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        sa.status === 'active'
                          ? 'border-rose-100 bg-rose-50/30 hover:bg-rose-50 text-rose-600'
                          : 'border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {sa.status === 'active' ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(sa.id, sa.name)}
                      className="p-2.5 bg-slate-50 hover:bg-rose-500 border border-slate-200 hover:border-rose-600 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="অ্যাকাউন্ট মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Audit Logs Section */
        <div className="bg-white rounded-[32px] border border-slate-150 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 border-dashed">
            <div>
              <h3 className="text-base font-black text-slate-900 Bengali-font">অডিটিং সিস্টেম এক্টিভিটি লগার</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">
                মডারেটরদের করা প্রতিটি কাজ স্বয়ংক্রিয়ভাবে ট্র্যাকিং ও অডিট করা হয়। এটি সুপার অ্যাডমিন কর্তৃক ডিলিট করার সুযোগ নেই।
              </p>
            </div>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllLogs}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-700 text-rose-600 hover:text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সমস্ত লগ ডিলিট করুন</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">সময়কাল (Timestamp UTC)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">অ্যাডমিন আইডি (Admin ID)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">কাজের ধরন (Action Type)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">মূল বিবরণ (Details Record)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                      কোনো অ্যাক্টিভিটি ইতিহাস পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    // Prettify different actions with colorful tags
                    let tagStyle = 'bg-slate-100 text-slate-655';
                    if (log.actionType.includes('SUBADMIN')) {
                      tagStyle = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
                    } else if (log.actionType.includes('ADD_BOOK') || log.actionType.includes('APPROVE')) {
                      tagStyle = 'bg-emerald-5 border border-emerald-100 text-emerald-700';
                    } else if (log.actionType.includes('DELETE') || log.actionType.includes('REJECT') || log.actionType.includes('SUSPEND')) {
                      tagStyle = 'bg-rose-5 border border-rose-100 text-rose-700';
                    } else if (log.actionType.includes('ISSUE')) {
                      tagStyle = 'bg-amber-50 border border-amber-100 text-amber-700';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/20 text-xs font-semibold text-slate-700 transition">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('bn-BD', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.adminId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black font-mono tracking-wide ${tagStyle}`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-800 Bengali-font">
                          {log.affectedRecordId}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Up Form Modal */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden border border-slate-100 shadow-2xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingSubAdmin ? 'মডারেটর পাসওয়ার্ড পরিবর্তন' : 'নতুন মডারেটর অ্যাকাউন্ট তৈরি'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">সবগুলো ঘর সঠিক তথ্য দিয়ে পূরণ করুন</p>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 mb-5 bg-rose-50 border border-rose-150 text-rose-600 text-xs font-bold rounded-2xl text-center">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveSubAdmin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">মডারেটরের নাম</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="যেমন: ডয়েন হাসান"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!editingSubAdmin}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">ইমেইল ঠিকানা</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="moderator@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!editingSubAdmin}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">লগইন পাসওয়ার্ড</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="গোপন সংকেত..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer"
                  >
                    {editingSubAdmin ? 'পরিবর্তন সংরক্ষণ করুন' : 'মডারেটর তৈরি করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* State-Based Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmState.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden border border-slate-100 shadow-2xl p-8 text-center z-10"
            >
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900 Bengali-font mb-2">
                {confirmState.title}
              </h3>
              <p className="text-xs text-slate-500 font-bold mb-6 Bengali-font leading-relaxed">
                {confirmState.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={confirmState.onConfirm}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  হ্যাঁ, নিশ্চিত করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
