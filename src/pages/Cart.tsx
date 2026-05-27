import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../lib/cart';
import { 
  Minus, Plus, Trash2, ArrowLeft, CreditCard, ShoppingBag, 
  BookOpen, AlertCircle, ShoppingCart, Target, ShieldCheck, MapPin, Phone, 
  DollarSign, CheckSquare, Sparkles, Send, Award, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, SupabaseOrder } from '../lib/supabaseDatabase';
import { cn } from '../lib/utils';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  // Authentication & Checkout states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment_gateway' | 'completed'>('cart');
  
  // Shipping input values
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'COD'>('bKash');
  
  // Gateway specific values
  const [gatewayPhone, setGatewayPhone] = useState('');
  const [gatewayPin, setGatewayPin] = useState('');
  const [gatewayError, setGatewayError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('loggedInUser');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        setPhone(u.phone || '');
        setAddress(u.address || '');
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleStartCheckout = () => {
    if (!currentUser) {
      // Prompt user to register/login
      navigate('/login?redirect=cart');
      return;
    }
    if (currentUser.role !== 'Admin') {
      if (currentUser.status === 'pending') {
        alert('আপনার অ্যাকাউন্ট বর্তমানে পেন্ডিং রয়েছে। এডমিন এটি সক্রিয় করার আগে আপনি অর্ডার সম্পন্ন করতে পারবেন না।');
        return;
      }
      if (currentUser.status === 'rejected') {
        alert('দুঃখিত, আপনার অ্যাকাউন্ট বাতিল (Rejected) করা হয়েছে। আপনি অর্ডার বা বই কিনতে পারবেন না।');
        return;
      }
    }
    setCheckoutStep('shipping');
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address) {
      alert('দয়া করে শিপিং ঠিকানা এবং মোবাইল নম্বর প্রদান করুন!');
      return;
    }
    if (paymentMethod === 'COD') {
      // Directly place order since it is Cash on Delivery
      handlePlaceOrder();
    } else {
      setGatewayPhone(phone);
      setCheckoutStep('payment_gateway');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setProcessingPayment(true);
      const orderItemsStr = items.map(i => `${i.title} (x${i.quantity})`).join(', ');
      
      const newOrder: Partial<SupabaseOrder> = {
        memberId: currentUser?.id || 'M-GUEST',
        customerName: currentUser?.name || 'পরিচিত সদস্য',
        customerEmail: currentUser?.email || '',
        customerPhone: phone,
        address: address,
        date: new Date().toLocaleDateString('bn-BD'),
        total: totalPrice,
        items: orderItemsStr,
        status: 'Pending'
      };

      const saved = await db.saveOrder(newOrder);
      setPlacedOrderId(saved.id);
      
      // Simulate confirmation email log or notice in developer log
      console.log(`[Order Placed] Mail notification prepared for ${currentUser?.email || 'user'}`);

      // Clear Cart!
      clearCart();
      setCheckoutStep('completed');
    } catch (err) {
      console.error(err);
      alert('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে! আবার চেষ্টা করুন।');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleGatewayPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayPhone || gatewayPhone.length < 11) {
      setGatewayError('সঠিক মোবাইল ওয়ালেট নম্বর প্রদান করুন!');
      return;
    }
    if (gatewayPin.length < 4) {
      setGatewayError('৪ অঙ্কের সঠিক পিন নম্বর দিন');
      return;
    }

    setGatewayError('');
    setProcessingPayment(true);
    
    // Simulate API authorization loop delay
    setTimeout(() => {
      handlePlaceOrder();
    }, 2000);
  };

  if (checkoutStep === 'completed') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-10 md:p-16 shadow-2xl shadow-indigo-100 border border-slate-100"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
            <ShieldCheck className="w-12 h-12" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">পেমেন্ট সফল ও অর্ডার সম্পন্ন!</h2>
          <p className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full inline-block mb-8">
            অর্ডার আইডি: #{placedOrderId}
          </p>

          <p className="text-slate-500 text-base leading-relaxed font-bold max-w-lg mx-auto mb-12">
            অভিনন্দন! আপনার পেমেন্টটি সফলভাবে সম্পন্ন হয়েছে এবং অর্ডারটি সিস্টেমে যুক্ত করা হয়েছে। 
            অ্যাডমিন সেটি গ্রহণ (Accept) করলে আপনার ইমেইলে নোটিফিকেশন পৌঁছে যাবে এবং আপনি আপনার ড্যাশবোর্ডে স্ট্যাটাস পর্যবেক্ষণ করতে পারবেন।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/account" 
              className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/10"
            >
              <Award className="w-5 h-5" />
              <span>আপনার অ্যাকাউন্ট চেক করুন</span>
            </Link>
            
            <Link 
              to="/books" 
              className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-slate-50 text-slate-700 rounded-[24px] font-black hover:bg-slate-100 transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>আরও বই ব্রাউজ করুন</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && (checkoutStep as string) !== 'completed') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[60px] p-20 shadow-xl border border-slate-100 inline-block"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">আপনার কার্ট খালি</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto">আপনার পছন্দের বইটি খুঁজে নিতে আমাদের বই সংগ্রহশালা ঘুরে দেখুন।</p>
          <Link 
            to="/books" 
            className="inline-flex items-center space-x-3 px-10 py-5 bg-indigo-600 text-white rounded-[30px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>বই খুঁজতে যান</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Checkout step visualizer */}
      <div className="flex items-center justify-center space-x-4 mb-14 max-w-md mx-auto">
        <div className={cn("text-xs font-black px-4 py-2 rounded-full", checkoutStep === 'cart' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400" )}>১. কার্ট</div>
        <div className="h-0.5 w-8 bg-slate-200" />
        <div className={cn("text-xs font-black px-4 py-2 rounded-full", checkoutStep === 'shipping' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400" )}>২. শিপিং ও পেমেন্ট</div>
        <div className="h-0.5 w-8 bg-slate-200" />
        <div className={cn("text-xs font-black px-4 py-2 rounded-full", checkoutStep === 'payment_gateway' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400" )}>৩. ভেরিফিকেশন</div>
      </div>

      <AnimatePresence mode="wait">
        {checkoutStep === 'cart' && (
          <motion.div 
            key="cart_step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-4xl font-black text-slate-900 mb-2">আপনার শপিং কার্ট</h1>
              <p className="text-sm font-bold text-slate-400 mb-8">{totalItems} টি বই কার্টে যুক্ত আছে</p>
              
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center space-x-6 md:space-x-10"
                  >
                    <div className="w-24 h-32 md:w-32 md:h-44 flex-shrink-0 bg-slate-100 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                      {item.cover && item.cover !== "" ? (
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 truncate leading-tight">{item.title}</h3>
                      <div className="text-rose-500 font-black text-lg mb-6">৳ {item.price}</div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-6 font-black text-slate-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl sticky top-32">
                <h2 className="text-2xl font-black text-slate-900 mb-8">অর্ডার সামারি</h2>
                
                <div className="space-y-6 mb-10 pb-10 border-b border-slate-100">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>উপ-মোট</span>
                    <span>৳ {totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>শিপিং চার্জ</span>
                    <span className="text-emerald-500 font-bold">ফ্রি (MBSTU ক্যাম্পাস)</span>
                  </div>
                  <div className="flex justify-between items-center pt-6">
                    <span className="text-xl font-black text-slate-900">সর্বমোট</span>
                    <span className="text-2xl font-black text-indigo-600">৳ {totalPrice}</span>
                  </div>
                </div>

                {!currentUser && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                    <p className="text-xs font-black text-amber-800 leading-relaxed flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>অর্ডার সম্পন্ন করতে দয়া করে প্রথমে অ্যাকাউন্ট তৈরি করুন অথবা লগইন সম্পন্ন করুন।</span>
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleStartCheckout}
                  className="w-full py-6 bg-slate-950 text-white rounded-[32px] font-black flex items-center justify-center space-x-4 shadow-2xl hover:bg-indigo-600 transition-all active:scale-[0.98] group"
                >
                  <CreditCard className="w-6 h-6 group-hover:rotate-12 transition-transform color-white" />
                  <span className="text-xl text-white">অর্ডারে এগিয়ে যান</span>
                </button>

                <Link 
                  to="/books" 
                  className="mt-6 w-full py-4 text-slate-400 font-bold text-center block hover:text-slate-900 transition-colors"
                >
                  আরও বই দেখুন
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {checkoutStep === 'shipping' && (
          <motion.div 
            key="shipping_step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto"
          >
            <div className="lg:col-span-2 space-y-8 bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 text-left">
              <div>
                <button onClick={() => setCheckoutStep('cart')} className="flex items-center text-xs font-black text-slate-400 hover:text-slate-900 gap-1 mb-4 uppercase tracking-widest">
                  <ArrowLeft className="w-3.5 h-3.5" /> কার্টে ফেরত যান
                </button>
                <h2 className="text-3xl font-black text-slate-900">শিপিং ও বিলিং বিবরণী</h2>
                <p className="text-slate-400 text-sm mt-1 font-bold">সঠিক ঠিকানা এবং তথ্য দিন যেন লাইব্রেরী টিম আপনার কাছে পৌঁছাতে পারে</p>
              </div>

              <form onSubmit={handleNextToPayment} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">সদস্যের নাম</label>
                    <input type="text" disabled value={currentUser?.name} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">ইমেইল এড্রেস</label>
                    <input type="text" disabled value={currentUser?.email} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">মোবাইল নম্বর *</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      placeholder="যেমন: ০১XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">বিতরণ ঠিকানা (Delivery Address) *</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="যেমন: অর্থনীতি বিভাগ, রুম ৩১২, MBSTU"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">পেমেন্ট ওয়ালেট বা পদ্ধতি নির্বাচন করুন</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('bKash')}
                      className={cn(
                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2",
                        paymentMethod === 'bKash' ? "border-pink-500 bg-pink-50/50 text-pink-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-black text-sm relative overflow-hidden">
                        bK
                      </div>
                      <span className="text-xs font-black">বিকাশ (bKash)</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('Nagad')}
                      className={cn(
                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2",
                        paymentMethod === 'Nagad' ? "border-orange-500 bg-orange-50/50 text-orange-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-sm relative overflow-hidden">
                        ল
                      </div>
                      <span className="text-xs font-black">নগদ (Nagad)</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={cn(
                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2",
                        paymentMethod === 'COD' ? "border-indigo-600 bg-indigo-50/40 text-indigo-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-sm">
                        COD
                      </div>
                      <span className="text-xs font-black">ক্যাশ অন ডেলিভারী</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    {paymentMethod === 'COD' ? 'অর্ডার সম্পন্ন করুন' : 'পেমেন্ট গেটওয়েতে যান'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl text-left">
                <h3 className="text-xl font-black text-slate-900 mb-6">আপনার অর্ডার</h3>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto no-scrollbar mb-6">
                  {items.map(item => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{item.title}</p>
                        <p className="text-xs font-bold text-slate-400">পরিমাণ: {item.quantity} টি</p>
                      </div>
                      <span className="text-sm font-black text-slate-900 shrink-0">৳ {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400">চার্জ</span>
                    <span className="text-sm font-black text-emerald-500">ফ্রি</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-black text-slate-900 border-t border-slate-50 pt-4">
                    <span>সর্বমোট</span>
                    <span className="text-indigo-600">৳ {totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {checkoutStep === 'payment_gateway' && (
          <motion.div 
            key="payment_gateway_step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto bg-white rounded-[48px] border border-slate-100 shadow-2xl p-8 md:p-10 text-left relative overflow-hidden"
          >
            {paymentMethod === 'bKash' ? (
              <div className="absolute top-0 inset-x-0 h-4 bg-pink-500" />
            ) : (
              <div className="absolute top-0 inset-x-0 h-4 bg-orange-500" />
            )}

            <button onClick={() => setCheckoutStep('shipping')} className="flex items-center text-[10px] font-black text-slate-400 hover:text-slate-900 gap-1 mb-6 uppercase tracking-widest">
              <ArrowLeft className="w-3.5 h-3.5" /> পেছনে যান
            </button>

            <div className="text-center mb-8">
              {paymentMethod === 'bKash' ? (
                <div className="w-20 h-20 bg-pink-500 text-white hover:bg-pink-600 transition-colors rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  bK
                </div>
              ) : (
                <div className="w-20 h-20 bg-orange-500 text-white hover:bg-orange-600 transition-colors rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  না
                </div>
              )}
              <h3 className="text-2xl font-black text-slate-900">{paymentMethod === 'bKash' ? 'বিকাশ (bKash) পেমেন্ট' : 'নগদ (Nagad) পেমেন্ট'}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">সুরক্ষিত মোবাইল ওয়ালেট বিলিং গেটওয়ে</p>
            </div>

            <div className="bg-slate-50 px-5 py-4 rounded-2xl mb-6">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>প্রাপক: MBSTU লাইব্রেরী ফান্ড</span>
                <span>পরিমাণ: <strong className="text-sm font-black text-slate-900">৳ {totalPrice}</strong></span>
              </div>
            </div>

            {gatewayError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{gatewayError}</span>
              </div>
            )}

            <form onSubmit={handleGatewayPaymentSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">মোবাইল ওয়ালেট নম্বর (Wallet Number)</label>
                <input 
                  type="tel"
                  required
                  placeholder="যেমন: ০১৭১XXXXXXX"
                  value={gatewayPhone}
                  onChange={(e) => setGatewayPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">৪ বা ৫ অঙ্কের গোপন পিন (Security PIN)</label>
                <input 
                  type="password"
                  required
                  maxLength={5}
                  placeholder="••••"
                  value={gatewayPin}
                  onChange={(e) => setGatewayPin(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black tracking-widest text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-2 text-[10px] font-bold text-slate-400 leading-relaxed mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>আপনার পিন নম্বরটি সম্পূর্ণ নিরাপদ আমাদের সার্ভারে কোনো পিন সংরক্ষিত করা হয় না। এটি একটি ডেমো পেমেন্ট নোটিফিকেশন সিস্টেম মাত্র।</span>
              </div>

              <button 
                type="submit"
                disabled={processingPayment}
                className={cn(
                  "w-full py-5 rounded-2xl text-white font-black text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                  paymentMethod === 'bKash' ? "bg-pink-500 hover:bg-pink-600 shadow-pink-100" : "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
                  processingPayment && "opacity-75 cursor-wait"
                )}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>পেমেন্ট প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <span>পেমেন্ট সম্পন্ন করুন (৳ {totalPrice})</span>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
