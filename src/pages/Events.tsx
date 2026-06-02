import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Facebook, Globe, Loader2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, SupabaseEvent } from '../lib/supabaseDatabase';

export default function Events() {
  const [events, setEvents] = useState<SupabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await db.getEvents();
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen bg-transparent">
      <div className="text-center mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black tracking-widest uppercase border border-indigo-100"
        >
          <Award className="w-4 h-4" />
          <span>লাইব্রেরী কার্যক্রম ও ইভেন্ট</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-850 tracking-tight">ইভেন্ট আপডেট ও নোটিশ বোর্ড</h1>
        <p className="text-slate-500 font-bold max-w-lg mx-auto text-sm">অর্থনীতি বিভাগ, MBSTU লাইব্রেরির সকল সচল প্রোগ্রাম, বইমেলা ও নোটিশসমূহ এখানে আপডেট করা হয়।</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white rounded-[40px] border border-slate-100 p-10 md:p-16 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-10">
            <img 
              src="https://scontent.fdac181-1.fna.fbcdn.net/v/t39.30808-6/485961209_1189929272837388_4249405793488848808_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=kqGDwMhtSMAQ7kNvwG0EW8g&_nc_oc=AdpkGsr9P5RLxFJkKIZlmZD_DU2asXlikcl_M_b-vuYkMhQfs-XL53b3HGogNVQZdfw&_nc_zt=23&_nc_ht=scontent.fdac181-1.fna&_nc_gid=FHyHnNWjpWI4UOtifSG6xQ&_nc_ss=7b289&oh=00_Af5bxRxoZcONdLMmo_tt3JJhqLfo7DgZJzBoZ62cWSGb-A&oe=6A0C3C6E" 
              alt="Economics Department MBSTU" 
              className="w-full h-full object-cover rounded-full shadow-md border-[6px] border-white"
            />
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border-[4px] border-white shadow-md">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-6 font-display">আপাতত নতুন কোনো ইভেন্ট নেই</h2>
          <p className="text-slate-500 mb-12 text-lg font-semibold leading-relaxed max-w-xl mx-auto">
            আগামী ইভেন্টের আপডেট পেতে আমাদের অফিশিয়াল ওয়েবসাইট এবং ফেসবুক পেজে চোখ রাখুন।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://eco.mbstu.ac.bd/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[24px] font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              <Globe className="w-6 h-6" />
              <span>অফিশিয়াল ওয়েবসাইট</span>
            </a>
            
            <a 
              href="https://www.facebook.com/ecombstu/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
            >
              <Facebook className="w-6 h-6" />
              <span>ফেসবুক পেজ</span>
            </a>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto text-left">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[40px] border border-slate-150 overflow-hidden flex flex-col justify-between group hover:border-indigo-550/40 shadow-xl shadow-slate-100/50 transition-all"
            >
              <div>
                {/* Event Cover Image */}
                <div className="h-56 w-full bg-slate-50 relative overflow-hidden">
                  <img 
                    src={event.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600'} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-slate-800 text-xs font-black tracking-wide flex items-center gap-2 shadow-md border border-slate-150/40">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{event.date}</span>
                  </div>
                </div>

                {/* Event Description and information */}
                <div className="p-8 space-y-6">
                  <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{event.title}</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed">{event.description}</p>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3 text-slate-500 font-bold text-xs">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>সময়: {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-500 font-bold text-xs">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>স্থান: {event.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {event.fbLink && (
                <div className="p-8 pt-0">
                  <a 
                    href={event.fbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-700 rounded-2xl hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200 hover:border-indigo-600 font-black text-sm uppercase shadow-sm cursor-pointer"
                  >
                    <Facebook className="w-4 h-4" />
                    <span>ইভেন্ট বিস্তারিত দেখুন</span>
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
