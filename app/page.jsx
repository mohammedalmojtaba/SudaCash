'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [view, setView] = useState('user'); 
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // خيارات الفرز والتصفية
  const [maxComm, setMaxComm] = useState(25);
  const [filterNeed, setFilterNeed] = useState('all'); // 'all', 'cash', 'mbok'

  // حقول إضافة الوكيل (تم تعديلها لتبدأ فارغة لتمكين التلميحات الرمادية)
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState(''); // فارغ ليعرض Placeholder "12"
  const [cash, setCash] = useState(''); // فارغ ليعرض Placeholder "500,000"
  const [providesCash, setProvidesCash] = useState(true);
  const [providesMbok, setProvidesMbok] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // جلب البيانات مع ميزة التخزين المؤقت لحماية استهلاك الخطة المجانية
  const fetchAgents = async (force = false) => {
    const cachedData = localStorage.getItem('sudacash_agents_cache');
    const cachedTime = localStorage.getItem('sudacash_agents_time');
    const now = Date.now();
    
    if (cachedData && cachedTime && (now - cachedTime < 300000) && !force) {
      setAgents(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      const cleanData = Array.isArray(data) ? data : [];
      setAgents(cleanData);
      localStorage.setItem('sudacash_agents_cache', JSON.stringify(cleanData));
      localStorage.setItem('sudacash_agents_time', now.toString());
    } catch (err) {
      console.error("فشل في جلب البيانات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [view]);

  // دالة لتنسيق أرقام الكاش بفواصل الآلاف أثناء الكتابة
  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // حذف أي رمز غير عددي
    if (rawValue === '') {
      setCash('');
      return;
    }
    const formatted = Number(rawValue).toLocaleString('en-US');
    setCash(formatted);
  };

  // إرسال تحديثات الوكيل لقاعدة البيانات
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!shopName || !phone) return alert('الرجاء إدخال اسم المتجر ورقم الهاتف للتحقق');
    if (!providesCash && !providesMbok) {
      return alert('الرجاء تحديد خيار واحد على الأقل مما توفره (كاش أو بنكك)');
    }
    setIsUpdating(true);

    // استخدام القيم المدخلة أو استرجاع القيم الافتراضية إذا ترك الحقل فارغاً
    const finalCommission = commission === '' ? 12 : Number(commission);
    const finalCash = cash === '' ? 500000 : Number(cash.replace(/,/g, ''));

    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shop_name: shopName, 
          phone, 
          commission: finalCommission, 
          cash: finalCash, 
          provides_cash: providesCash,
          provides_mbok: providesMbok,
          is_verified: isVerified 
        })
      });
      alert('تم تحديث حالتك وبثها بنجاح في محيطك!');
      localStorage.removeItem('sudacash_agents_cache'); // إجبار النظام على تحديث البيانات فوراً
      setView('user');
    } catch (err) {
      alert('حدث خطأ أثناء بث الحالة');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (agent.commission > maxComm) return false;
    
    const hasCash = agent.provides_cash !== false; 
    const hasMbok = agent.provides_mbok === true;  

    if (filterNeed === 'cash' && !hasCash) return false;
    if (filterNeed === 'mbok' && !hasMbok) return false;

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-100">
      {/* أعلى الصفحة */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <h1 className="font-extrabold text-md tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            سوداكاش | SudaCash
          </h1>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setView('user')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'user' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950' : 'text-slate-400'}`}>بحث عن كاش</button>
          <button onClick={() => setView('agent')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'agent' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950' : 'text-slate-400'}`}>بث كوكيل</button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {view === 'user' ? (
          <div>
            {/* خيارات التصفية */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 mb-6 backdrop-blur-md space-y-4">
              <h2 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">تخصيص البحث</h2>
              
              {/* اختيار نوع الخدمة المطلوبة */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5">ماذا تحتاج؟</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setFilterNeed('all')} 
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${filterNeed === 'all' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                  >
                    الكل
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilterNeed('cash')} 
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${filterNeed === 'cash' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                  >
                    💵 كاش نقد
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilterNeed('mbok')} 
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${filterNeed === 'mbok' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                  >
                    📱 تحويل بنكك
                  </button>
                </div>
              </div>

              {/* شريط التحكم في أقصى عمولة */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">أقصى نسبة عمولة مقبولة</span>
                  <span className="text-cyan-400 font-black">{maxComm}%</span>
                </div>
                <input type="range" min="5" max="30" value={maxComm} onChange={(e) => setMaxComm(Number(e.target.value))} className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>

            {/* عنوان القائمة */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">الوكلاء المتوفرون الآن</h3>
              <button onClick={() => fetchAgents(true)} className="text-xs text-emerald-400 hover:underline">🔄 تحديث يدوي</button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500 text-xs">جاري فحص شبكة الوكلاء...</div>
            ) : (
              <div className="space-y-3">
                {filteredAgents.map(agent => {
                  const hasCash = agent.provides_cash !== false;
                  const hasMbok = agent.provides_mbok === true;

                  return (
                    <div key={agent.id} className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-200 text-base flex items-center gap-1.5">
                            {agent.shop_name}
                            {agent.is_verified && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">🌟 موثوق</span>
                            )}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">تحديث: {new Date(agent.last_updated).toLocaleTimeString('ar-SD')}</span>
                          
                          {/* شارات الخدمات المتوفرة لدى هذا الوكيل */}
                          <div className="flex gap-1.5 mt-2">
                            {hasCash && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                💵 يوفر كاش
                              </span>
                            )}
                            {hasMbok && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                                📱 يوفر بنكك
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-black text-xl">{agent.commission}%</div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">عمولة التسييل</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-800/40">
                        <div>
                          <span className="text-[9px] text-slate-500 block">النقد/الرصيد المتوفر</span>
                          <span className="font-mono text-cyan-400 font-bold text-sm">{agent.cash.toLocaleString()} ج.س</span>
                        </div>
                      </div>
                      <a href={`tel:${agent.phone}`} className="mt-3 flex items-center justify-center py-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all">
                        📞 اتصال لتأكيد وحجز الخدمة
                      </a>
                    </div>
                  );
                })}
                {filteredAgents.length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-xs">لا يوجد وكلاء يطابقون هذه الفلاتر حالياً.</div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* لوحة التحكم للوكلاء */
          <form onSubmit={handleBroadcast} className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">بث كوكيل كاش</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">اضبط إعدادات النقد والعمولة لتظهر للمستخدمين الباحثين عن كاش أو تحويل بنكك في منطقتك.</p>
            </div>
            
            {/* تحديد ما يوفره الوكيل للمستخدمين */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">ماذا توفر في متجرك حالياً؟</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvidesCash(!providesCash)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${providesCash ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  💵 توفير نقد (كاش ورقي)
                </button>
                <button
                  type="button"
                  onClick={() => setProvidesMbok(!providesMbok)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${providesMbok ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  📱 توفير تحويل بنكك (رقمي)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">اسم المتجر / المحل</label>
              <input type="text" placeholder="مثال: بقالة الأمل - بورتسودان" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">رقم الهاتف لطلب الخدمة</label>
              <input type="tel" placeholder="مثال: 0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* حقل إدخال الكاش مع تلميح وتنسيق الفواصل */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">الكاش / الرصيد المتوفر</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="500,000" 
                  value={cash} 
                  onChange={handleCashChange} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500 placeholder-slate-600" 
                />
              </div>
              {/* حقل إدخال العمولة مع تلميح رمادي مخصص */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">عمولتك الحالية (%)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="12" 
                  value={commission} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setCommission(val);
                    }
                  }} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500 placeholder-slate-600" 
                />
              </div>
            </div>

            {/* مساحة التوثيق المدفوع */}
            <div className="p-4 bg-slate-900/50 rounded-xl border border-amber-500/20">
              <h4 className="text-xs font-bold text-amber-400 mb-1">🌟 تفعيل شارة وكيل معتمد</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                هل تريد مضاعفة ظهورك للعملاء؟ قم بتحويل رسوم الاشتراك الرمزي (5,000 ج.س شهرياً) إلى حساب بنكك التالي:
                <br />
                <span>حساب بنكك: </span><span className="font-mono text-cyan-400 font-bold">3767723</span> باسم <span className="font-bold text-slate-200">محمد المجتبى عصام</span>
                <br />
                ثم أرسل لقطة شاشة للتحويل عبر واتساب إلى الرقم{' '}
                <a 
                  href="https://wa.me/249999119052" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-400 font-bold underline hover:text-emerald-300"
                >
                  +249999119052
                </a>{' '}
                ليقوم المشرف بتفعيل الشارة الذهبية لحسابك.
              </p>
            </div>

            <button type="submit" disabled={isUpdating} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:opacity-90 disabled:opacity-50">
              {isUpdating ? 'جاري بث الإشارة...' : 'بث تحديث الخدمة الآن'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
