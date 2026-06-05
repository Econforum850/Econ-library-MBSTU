import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Layers, CheckCircle, ArrowUpRight, Bookmark, 
  AlertTriangle, Hammer, Plus, Minus, Tag, MapPin, Hash, BarChart2,
  Trash2, ShieldAlert
} from 'lucide-react';
import { db, SupabaseBook } from '@/src/lib/supabaseDatabase';

interface BookDetailsModalProps {
  book: SupabaseBook | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BookDetailsModal({ book, isOpen, onClose, onUpdate }: BookDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);

  if (!book) return null;

  // Exact Formula: Available Copies = Total Copies - Issued - Reserved - Lost - Damaged
  const total = book.totalCopies !== undefined ? Number(book.totalCopies) : book.stock;
  const issued = book.issuedCopies !== undefined ? Number(book.issuedCopies) : 0;
  const reserved = book.reservedCopies !== undefined ? Number(book.reservedCopies) : 0;
  const lost = book.lostCopies !== undefined ? Number(book.lostCopies) : 0;
  const damaged = book.damagedCopies !== undefined ? Number(book.damagedCopies) : 0;
  const available = Math.max(0, total - issued - reserved - lost - damaged);

  // Status Rules:
  // - Available Copies > 0 = Available
  // - Available Copies = 0 = Out of Stock
  // - Lost Copies > 0 = Needs Review
  // - Damaged Copies > 0 = Maintenance Required
  let statusText = 'Available';
  let statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-250';
  
  if (available === 0) {
    statusText = 'Out of Stock';
    statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-250';
  } else if (lost > 0) {
    statusText = 'Needs Review (lost)';
    statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-250';
  } else if (damaged > 0) {
    statusText = 'Maintenance Required';
    statusBadgeColor = 'bg-orange-50 text-orange-700 border-orange-250';
  }

  const handleUpdateField = async (fieldsToUpdate: Partial<SupabaseBook>, logAction: string, logMsg: string) => {
    try {
      setUpdating(true);
      const updatedBook: SupabaseBook = {
        ...book,
        ...fieldsToUpdate
      };
      
      // Save to Database
      await db.saveBook(updatedBook);
      
      // Log Audit History
      try {
        await db.addAuditLog(logAction, logMsg);
      } catch (_) {}

      onUpdate();
    } catch (err) {
      console.error('Failed to adjust book inventory:', err);
      alert('ইনভেন্টরি তথ্য পরিবর্তনে ত্রুটি হয়েছে।');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-white w-full max-w-4xl rounded-[50px] shadow-2xl overflow-hidden p-8 md:p-10 overflow-y-auto max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">বইয়ের বিস্তারিত ইনভেন্টরি ট্র্যাকিং</h3>
                  <p className="text-xs font-bold text-slate-400">রিয়েল-টাইম স্টক, ক্ষতি এবং ক্যাটালগ পর্যালোচনা করুন</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Cover and Primary Details */}
              <div className="lg:col-span-4 flex flex-col items-center text-center p-6 bg-slate-50/50 rounded-[35px] border border-slate-100">
                <div className="w-36 h-48 rounded-[24px] overflow-hidden shadow-lg border border-slate-100 bg-white mb-4 relative group">
                  {book.cover ? (
                    <img src={book.cover} className="w-full h-full object-cover" alt={book.title} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-slate-200" />
                    </div>
                  )}
                </div>

                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wider mb-2">
                  {book.category}
                </span>

                <h4 className="text-lg font-black text-slate-900 leading-tight mb-1">{book.title}</h4>
                <p className="text-xs font-bold text-slate-400 mb-4">{book.author}</p>

                {/* Status Badging */}
                <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase tracking-wider mb-6 flex items-center gap-1.5 ${statusBadgeColor}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{statusText === 'Available' ? 'মজুদ আছে' : statusText === 'Out of Stock' ? 'ষ্টক আউট' : statusText === 'Needs Review (lost)' ? 'পর্যালোচনা প্রয়োজন (হারানো)' : 'রক্ষণাবেক্ষণ চলছে'}</span>
                </div>

                {/* Additional Information */}
                <div className="w-full space-y-2.5 text-left pt-5 border-t border-slate-200/50">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Book ID:</span>
                    <span className="font-mono text-slate-900 tracking-wider font-extrabold">{book.bookId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> ISBN:</span>
                    <span className="font-mono text-slate-950 font-black">{book.isbn || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> সেলফ অবস্থান:</span>
                    <span className="text-slate-950 font-black">{book.shelfNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">ধরণ:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${book.isEBook ? "bg-purple-100 text-purple-700" : "bg-teal-150 text-teal-700"}`}>
                      {book.isEBook ? 'ডিজিটাল ই-বুক' : 'ভৌত লাইব্রেরি বই'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantities, Graphs, Actions */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual Math Chart */}
                <div className="p-6 bg-slate-900 rounded-[35px] text-white shadow-xl relative overflow-hidden">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">ভৌত ইনভেন্টরি পরিমাণ বিশ্লেষণ</h4>
                  
                  {/* Grid of Micro Counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Total */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-center justify-between text-indigo-300 font-bold text-xs mb-1">
                        <span>মোট কপি</span>
                        <Layers className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{total}</span>
                    </div>

                    {/* Available */}
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
                      <div className="flex items-center justify-between text-emerald-300 font-bold text-xs mb-1">
                        <span>অবশিষ্ট মজুদ</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{available}</span>
                    </div>

                    {/* Issued */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl">
                      <div className="flex items-center justify-between text-blue-300 font-bold text-xs mb-1">
                        <span>ধার দেওয়া</span>
                        <ArrowUpRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{issued}</span>
                    </div>

                    {/* Reserved */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
                      <div className="flex items-center justify-between text-amber-300 font-bold text-xs mb-1">
                        <span>বুকড / পেন্ডিং</span>
                        <Bookmark className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{reserved}</span>
                    </div>

                    {/* Lost */}
                    <div className="p-4 bg-orange-500/10 border border-orange-500/25 rounded-2xl">
                      <div className="flex items-center justify-between text-orange-300 font-bold text-xs mb-1">
                        <span>হারানো কপি</span>
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{lost}</span>
                    </div>

                    {/* Damaged */}
                    <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
                      <div className="flex items-center justify-between text-rose-300 font-bold text-xs mb-1">
                        <span>ক্ষতিগ্রস্ত বই</span>
                        <Hammer className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-2xl font-black text-white font-mono">{damaged}</span>
                    </div>
                  </div>

                  {/* Visual copy distribution progress bar */}
                  <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">কপি ডিস্ট্রিবিউশন রেশিও</p>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500" style={{ width: `${total ? (available / total) * 100 : 100}%` }} title="Available" />
                      <div className="bg-blue-500" style={{ width: `${total ? (issued / total) * 100 : 0}%` }} title="Issued" />
                      <div className="bg-amber-500" style={{ width: `${total ? (reserved / total) * 100 : 0}%` }} title="Reserved" />
                      <div className="bg-orange-500" style={{ width: `${total ? (lost / total) * 100 : 0}%` }} title="Lost" />
                      <div className="bg-rose-500" style={{ width: `${total ? (damaged / total) * 100 : 0}%` }} title="Damaged" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 font-sans mt-1">
                      হিসাব সূত্র: অবশিষ্ট মজুদ ({available}) = মোট কপি ({total}) - ধার ({issued}) - পেন্ডিং ({reserved}) - হারানো ({lost}) - ক্ষতিগ্রস্ত ({damaged})
                    </p>
                  </div>
                </div>

                {/* Inventory Alerts Box */}
                <div className="p-6 bg-slate-50 rounded-[35px] border border-slate-100 flex flex-col gap-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ইনভেন্টরি এলার্ট ও স্বাস্থ্য</p>
                  
                  {available <= 2 && available > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-bold">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>মজুদ কম! অবশিষ্ট লাইব্রেরি কপি মাত্র {available} টি। বই পুনরায় সংগ্রহ করা প্রয়োজন।</span>
                    </div>
                  )}

                  {available === 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-bold animate-pulse">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>ষ্টক আউট! লাইব্রেরিতে ধার দেওয়ার মত কোনো কপি অবশিষ্ট নেই।</span>
                    </div>
                  )}

                  {lost > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 text-orange-850 text-sm font-bold">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                      <span>সতর্কতা: {lost} টি বইয়ের কপি "হারানো" হিসেবে লকড রয়েছে। রিভিউ বা সংশোধন করুন।</span>
                    </div>
                  )}

                  {damaged > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-850 text-sm font-bold">
                      <Hammer className="w-5 h-5 text-red-500 shrink-0" />
                      <span>সতর্কতা: {damaged} টি কপি বর্তমানে ড্যামেজড অবস্থায় রয়েছে। রক্ষণাবেক্ষণ সম্পন্ন হলে অবমুক্তি করুন।</span>
                    </div>
                  )}

                  {available > 2 && lost === 0 && damaged === 0 && (
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>ইনভেন্টরি স্বাস্থ্য সন্তোষজনক। সকল কপি ও ট্রানজেকশন সুরক্ষিত।</span>
                    </div>
                  )}
                </div>

                {/* Admin Speed Controls */}
                <div className="p-8 bg-indigo-50/15 border border-indigo-100 rounded-[35px] space-y-6">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">এডমিন ইনভেন্টরি একশন প্যানেল</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Increase/Decrease Total */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm">মোট কপি সংখ্যা</h5>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">লাইব্রেরিতে কপির মোট আকার পরিবর্তন</p>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateField(
                            { totalCopies: Math.max(1, total - 1) },
                            'INVENTORY_DECREASE',
                            `বই ক্যাটালগ থেকে মোট কপি ১টি কমানো হয়েছে: ${book.title}`
                          )}
                          className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border disabled:opacity-50 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" /> কমান
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateField(
                            { totalCopies: total + 1 },
                            'INVENTORY_INCREASE',
                            `বই ক্যাটালগে মোট কপি ১টি বাড়ানো হয়েছে: ${book.title}`
                          )}
                          className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border border-indigo-150 disabled:opacity-50 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> বাড়ান
                        </button>
                      </div>
                    </div>

                    {/* Lost Copy Control */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm">হারানো বই চিহ্নিতকরণ</h5>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">কপি হারিয়ে গেলে বা সংশোধন করলে</p>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        {lost > 0 && (
                          <button
                            disabled={updating}
                            onClick={() => handleUpdateField(
                              { lostCopies: Math.max(0, lost - 1) },
                              'INVENTORY_LOST_RESOLVE',
                              `বই ক্যাটালগে হারানো ১টি কপি উদ্ধার করা হয়েছে: ${book.title}`
                            )}
                            className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" /> উদ্ধার করুন
                          </button>
                        )}
                        <button
                          disabled={updating || available <= 0}
                          onClick={() => handleUpdateField(
                            { lostCopies: lost + 1 },
                            'INVENTORY_LOST',
                            `বইটির ১টি কপি হারিয়ে গেছে হিসাবে ট্র্যাকার আপডেট: ${book.title}`
                          )}
                          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border border-orange-150 disabled:opacity-50 cursor-pointer ${
                            available <= 0 
                              ? "bg-slate-50 text-slate-350" 
                              : "bg-orange-50 hover:bg-orange-100 text-orange-700"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" /> হারানো মার্ক
                        </button>
                      </div>
                    </div>

                    {/* Damaged Copy Control */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm">ক্ষতিগ্রস্ত বই লকিং</h5>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">নষ্ট বই মেরামত বা ডিক্লেয়ার পিরিয়ড</p>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        {damaged > 0 && (
                          <button
                            disabled={updating}
                            onClick={() => handleUpdateField(
                              { damagedCopies: Math.max(0, damaged - 1) },
                              'INVENTORY_DAMAGED_RESOLVE',
                              `বইটির ক্ষতিগ্রস্ত ১টি কপি মেরামত সম্পন্ন হয়েছে: ${book.title}`
                            )}
                            className="flex-1 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-150 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" /> মেরামত সম্পন্ন
                          </button>
                        )}
                        <button
                          disabled={updating || available <= 0}
                          onClick={() => handleUpdateField(
                            { damagedCopies: damaged + 1 },
                            'INVENTORY_DAMAGED',
                            `বইটির ১টি কপি ক্ষতিগ্রস্ত হিসাবে স্থানান্তর: ${book.title}`
                          )}
                          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border border-rose-150 disabled:opacity-50 cursor-pointer ${
                            available <= 0 
                              ? "bg-slate-50 text-slate-350" 
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                          }`}
                        >
                          <Hammer className="w-4 h-4" /> ড্যামেজ মার্ক
                        </button>
                      </div>
                    </div>

                    {/* Quick Manual Edit Details */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm">অগ্রসর ম্যানুয়াল এডিট</h5>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">আইএসবিএন, সেলফ অবস্থান দ্রুত পরিবর্তন</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsbnInput(book.isbn || '');
                          setShowAdvanceForm(!showAdvanceForm);
                        }}
                        className="w-full mt-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center gap-2 text-xs font-black border border-indigo-150 transition-all cursor-pointer font-sans"
                      >
                        {showAdvanceForm ? 'ফর্ম অবরুদ্ধ করুন' : 'অগ্রসর ট্র্যাকার খুলুন'}
                      </button>
                    </div>
                  </div>

                  {/* Advance quick fields update inline dropdown */}
                  <AnimatePresence>
                    {showAdvanceForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-5 bg-white border border-slate-100 rounded-2xl space-y-4 overflow-hidden mt-4 text-left"
                      >
                        <h6 className="text-[11px] font-black text-indigo-600 block uppercase tracking-wide">ক্যাটালগ ট্র্যাকার সংশোধন</h6>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase">ISBN</label>
                            <input 
                              type="text" 
                              placeholder="যেমন: 978-3-16-148410-0"
                              value={isbnInput}
                              onChange={(e) => setIsbnInput(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase">সংরক্ষিত পেন্ডিং (Reserved)</label>
                            <input 
                              type="number" 
                              min="0"
                              defaultValue={reserved}
                              id="quick_reserved"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-850"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            disabled={updating}
                            onClick={() => {
                              const resNode = document.getElementById('quick_reserved') as HTMLInputElement;
                              const updatedRes = resNode ? (parseInt(resNode.value) || 0) : reserved;
                              handleUpdateField(
                                { isbn: isbnInput, reservedCopies: updatedRes },
                                'INVENTORY_METADATA',
                                `বই ক্যাটালগ মেটাডেটা আপডেট: ${book.title}`
                              );
                              setShowAdvanceForm(false);
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer font-sans"
                          >
                            স্টোরেক সেভ করুন
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
