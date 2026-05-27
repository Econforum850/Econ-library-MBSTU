import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Plus, Edit, Trash2, 
  Search, RefreshCw, Loader2, X, AlertTriangle, Link as LinkIcon, Image
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, SupabaseEvent } from '@/src/lib/supabaseDatabase';

export default function AdminEvents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<SupabaseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SupabaseEvent | null>(null);
  
  // Field values
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [fbLink, setFbLink] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const fetched = await db.getEvents();
      setEvents(fetched);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setImage('');
    setFbLink('');
    setIsModalOpen(true);
  };

  const openEditModal = (event: SupabaseEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setDescription(event.description);
    setImage(event.image || '');
    setFbLink(event.fbLink || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ইভেন্টটি মুছে ফেলতে চান?')) {
      try {
        setLoading(true);
        await db.deleteEvent(id);
        await loadEvents();
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !location) {
      alert('অনুগ্রহ করে শিরোনাম, তারিখ এবং স্থান পূরণ করুন!');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<SupabaseEvent> = {
        title,
        date,
        time,
        location,
        description,
        image: image || undefined,
        fbLink
      };

      if (editingEvent) {
        payload.id = editingEvent.id;
      }

      await db.saveEvent(payload);
      setIsModalOpen(false);
      await loadEvents();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ইভেন্ট ও নোটিশ ব্যবস্থাপনা</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">লাইব্রেরির ইভেন্টস, ওয়ার্কশপ এবং নোটিশসমূহ অ্যাডমিন প্যানেল থেকে সম্পাদন করুন</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={openAddModal}
            className="flex items-center space-x-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-3xl font-black shadow-lg shadow-indigo-200 text-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন ইভেন্ট যোগ করুন</span>
          </button>
          <button 
            onClick={loadEvents}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ইভেন্ট বা স্থান দিয়ে খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">ইভেন্ট বিবরণী (Event Title)</th>
                  <th className="px-8 py-5">তারিখ ও সময়</th>
                  <th className="px-8 py-5">স্থান</th>
                  <th className="px-8 py-5">ফেসবুক লিঙ্ক</th>
                  <th className="px-8 py-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4 max-w-md">
                        <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          <img src={event.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=150'} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 line-clamp-1">{event.title}</h4>
                          <p className="text-xs text-slate-400 font-bold line-clamp-1">{event.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> {event.date}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3 text-slate-400" /> {event.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {event.location}</span>
                    </td>
                    <td className="px-8 py-6">
                      {event.fbLink ? (
                        <a href={event.fbLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>ফেসবুক ইভেন্ট</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">লিঙ্ক নেই</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(event)}
                          className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all text-indigo-600"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
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

      {/* Edit/Add Event Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">
                {editingEvent ? 'ইভেন্ট পরিবর্তন করুন 📝' : 'নতুন ইভেন্ট যোগ করুন 📣'}
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
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ইভেন্ট শিরোনাম *</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: বইমেলা বা পাঠক আড্ডা ২০২৬"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">তারিখ *</label>
                  <input 
                    type="text"
                    required
                    placeholder="যেমন: ১৫ মে, ২০২৬"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">সময়</label>
                  <input 
                    type="text"
                    placeholder="যেমন: বিকাল ৩:০০ টা"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">স্থান/ঠিকানা *</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: অর্থনীতি বিভাগ, MBSTU"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">কভার ইমেজ লিংক (Image Link)</label>
                <input 
                  type="text"
                  placeholder="যেমন: https://images.unsplash.com/... (বা ফাঁকা রাখুন)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ফেসবুক ইভেন্ট/পেজ লিংক</label>
                <input 
                  type="text"
                  placeholder="যেমন: https://www.facebook.com/..."
                  value={fbLink}
                  onChange={(e) => setFbLink(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ইভেন্ট বিবরণী</label>
                <textarea 
                  rows={4}
                  placeholder="ইভেন্টের বিস্তারিত বা বিবরণ লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
