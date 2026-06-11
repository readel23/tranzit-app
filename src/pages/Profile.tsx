import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult 
} from 'firebase/auth';
import { User, Phone, CheckSquare, Plus, ShoppingBag, Eye, Calendar, MapPin, Briefcase, FileText, ToggleLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { isLoggedIn, user, login, logout, updateUser } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  
  const addToCart = useCartStore((state) => state.addToCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Loading and blocking states
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // Repeat order dialog states
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[] | null>(null);
  
  // User order catalog state
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // 1. Fetch user data on logged-in
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoggedIn && auth.currentUser) {
        try {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            updateUser(docSnap.data());
          }
        } catch (error) {
          console.error("Ошибка при загрузке данных:", error);
        }
      }
    };
    fetchUserData();
  }, [isLoggedIn, updateUser]);

  // 2. Fetch order history
  useEffect(() => {
    let unsubscribe = () => {};

    if (isLoggedIn && auth.currentUser && activeTab === 'orders') {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUserOrders(ordersData);
        }, (error) => {
          console.error("Ошибка при загрузке заказов:", error);
        });
      } catch (e) {
        console.error("Ошибка инициализации запроса заказов:", e);
      }
    }

    return () => unsubscribe();
  }, [isLoggedIn, activeTab]);

  // 3. Clear Recaptcha widget
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) { console.error(e); }
      }
    };
  }, []);

  // 4. Set up Recaptcha verifier
  const setupRecaptcha = (containerId: string) => {
    try {
      if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => { console.log('Recaptcha пройдена'); }
      });
      return (window as any).recaptchaVerifier;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // 5. Send verification SMS
  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingCode) return;

    setIsSendingCode(true);

    const verifier = setupRecaptcha('recaptcha-container');
    if (!verifier) {
      setIsSendingCode(false);
      return alert("Ошибка безопасности. Обновите страницу.");
    }

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, ''); // strip non-numeric characters
      // Format number correctly
      const formattedPhone = cleanPhone.startsWith('7') ? `+7${cleanPhone}` : `+${cleanPhone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setAuthStep(2);
    } catch (error: any) {
      console.error("Ошибка при отправке СМС:", error);
      alert("Ошибка при отправке СМС. Пожалуйста, введите корректный номер мобильного телефона.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 6. Confirm Verification code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || isVerifyingCode) return;

    setIsVerifyingCode(true);
    try {
      const result = await confirmationResult.confirm(smsCode);
      login(result.user.phoneNumber || phoneNumber);
      setIsModalOpen(false);
      setAuthStep(1);
      setSmsCode('');
    } catch (error) {
      alert("Неверный код подтверждения из SMS. Повторите попытку.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 7. Save user settings to Firestore
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const dataToSave = {
        phone: user?.phone || '',
        isIp: user?.isIp || false,
        city: user?.city || '',
        address: user?.address || '',
        ipName: user?.ipName || ''
      };
      await setDoc(userRef, dataToSave, { merge: true });
      alert("Данные успешно сохранены!");
    } catch (error) {
      alert("Ошибка при сохранении.");
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Open Repeat order dialog
  const handleRepeatClick = (orderItems: any[]) => {
    setSelectedOrderItems(orderItems);
    setIsRepeatModalOpen(true);
  };

  // 9. Repeat order fill
  const confirmRepeatOrder = () => {
    if (!selectedOrderItems) return;

    clearCart();

    selectedOrderItems.forEach((item) => {
      addToCart({
        id: item.id,
        title: item.title,
        price: item.price,
        unit: item.unit,
        image: item.image,
      });

      if (item.quantity > 1) {
        updateQuantity(item.id, item.quantity - 1);
      }
    });

    setIsRepeatModalOpen(false);
    setSelectedOrderItems(null);
    navigate('/cart');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  // --- RENDERING UNAUTHORIZED STATE ---
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col max-w-xl mx-auto px-4 py-8 select-none">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight mb-6">{t.profile}</h1>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-3xl border border-gray-100 text-center flex flex-col items-center gap-5 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100">
            <User size={28} />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-black text-gray-800 leading-tight">
              {language === 'ru' ? 'Добро пожаловать в TRANZIT' : 'TRANZIT-ке қош келдіңіз'}
            </h2>
            <p className="text-xs text-gray-400 max-w-[280px] leading-relaxed mx-auto">
              {language === 'ru' ? 'Войдите с помощью вашего номера телефона, чтобы сохранять адреса доставок и видеть ваши предыдущие заказы.' : 'Жеткізу мекенжайларын сақтау және алдыңғы тапсырыстарыңызды көру үшін телефон нөміріңізбен кіріңіз.'}
            </p>
          </div>
          
          <button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-3.5 rounded-2xl text-xs font-extrabold shadow-sm cursor-pointer transition-all mt-1" 
            onClick={() => setIsModalOpen(true)}
          >
            {language === 'ru' ? 'Войти в систему' : 'Жүйеге кіру'}
          </button>
        </div>

        <div id="recaptcha-container"></div>

        {/* MODAL AUTH FLOW */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full relative shadow-xl border border-gray-100 flex flex-col gap-4 text-center"
            >
              <button 
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full border-0 outline-none flex items-center justify-center cursor-pointer transition-colors text-lg" 
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
              
              {authStep === 1 ? (
                <form className="flex flex-col gap-4" onSubmit={handleGetCode}>
                  <div className="font-extrabold text-2xl tracking-tighter text-gray-800 mt-2 uppercase">
                    TRANZIT <span className="text-emerald-500 font-black">MARKET</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-700">{language === 'ru' ? 'Вход в систему' : 'Жүйеге кіру'}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                      {language === 'ru' ? 'Введите ваш 10-значный номер мобильного телефона для подтверждения по СМС' : 'СМС арқылы растау үшін 10 таңбалы ұялы телефон нөміріңізді енгізіңіз'}
                    </p>
                  </div>

                  <div className="flex items-center bg-gray-50 border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white rounded-2xl overflow-hidden transition-all px-4 py-1">
                    <span className="text-xs font-bold text-gray-400 border-r border-gray-200 pr-3 mr-3">+7</span>
                    <input 
                      type="tel" 
                      placeholder="705 123 4567" 
                      className="w-full bg-transparent py-3 border-none outline-none font-semibold text-xs text-gray-800" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSendingCode}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-3.5 rounded-2xl text-xs font-extrabold transition-all mt-1"
                  >
                    {isSendingCode ? (language === 'ru' ? 'Отправляем код...' : 'Код жіберілуде...') : (language === 'ru' ? 'Получить СМС-код' : 'СМС-код алу')}
                  </button>
                </form>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={handleVerifyCode}>
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-700">{language === 'ru' ? 'Подтвердите СМС-код' : 'СМС-кодты растаңыз'}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                      {language === 'ru' ? 'Введите 6-значный код подтверждения, отправленный на ваш телефон' : 'Телефоныңызға жіберілген 6 таңбалы растау кодын енгізіңіз'}
                    </p>
                  </div>

                  <input 
                    type="text" 
                    placeholder="000000" 
                    maxLength={6}
                    className="w-full py-3.5 px-4 text-center tracking-[12px] bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white outline-none rounded-2xl font-black text-sm text-gray-800" 
                    value={smsCode} 
                    onChange={(e) => setSmsCode(e.target.value)} 
                    required 
                  />

                  <button 
                    type="submit" 
                    disabled={isVerifyingCode}
                    className="w-full bg-emerald-505 text-white py-3.5 rounded-2xl text-xs font-extrabold active:scale-95 transition-all mt-1"
                  >
                    {isVerifyingCode ? (language === 'ru' ? 'Проверяем...' : 'Тексерілуде...') : (language === 'ru' ? 'Войти в профиль' : 'Профильге кіру')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING AUTHENTICATED STATE ---
  return (
    <div className="flex flex-col max-w-xl mx-auto px-4 py-4 select-none pb-28">
      <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">{t.profile}</h1>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-gray-100 mt-4 mb-5 relative">
        <button 
          className={`flex-1 py-3 text-xs font-extrabold transition-all relative z-10 ${
            activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          {t.personalInfo}
        </button>
        <button 
          className={`flex-1 py-3 text-xs font-extrabold transition-all relative z-10 ${
            activeTab === 'orders' ? 'text-emerald-600' : 'text-gray-400'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          {t.myOrders}
        </button>
        <div 
          className="absolute bottom-0 h-0.5 bg-emerald-500 transition-all duration-300"
          style={{ 
            width: '50%', 
            left: activeTab === 'profile' ? '0%' : '50%' 
          }} 
        />
      </div>

      {activeTab === 'profile' && (
        <div className="flex flex-col gap-4">
          
          {/* Card containing Phone & IP Toggle */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t.phone}</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 font-semibold text-xs text-gray-500">
                <Phone size={14} className="text-gray-400" />
                <span>{user?.phone || ''}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">{t.business}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{language === 'ru' ? 'Для оптовых регулярных доставок' : 'Тұрақты көтерме жеткізілімдер үшін'}</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={user?.isIp || false} 
                  onChange={(e) => updateUser({ isIp: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Conditional Business Information */}
          {user?.isIp && (
            <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t.ipName}</label>
                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:border-emerald-500 px-3 py-1 transition-all">
                  <FileText size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input 
                    type="text" 
                    placeholder={language === 'ru' ? "Например: ИП 'Транзит Маркет'" : "Мысалы: 'Транзит Маркет' ЖК"}
                    className="w-full bg-transparent py-3 text-xs font-semibold text-gray-800 border-none outline-none"
                    value={user?.ipName || ''} 
                    onChange={(e) => updateUser({ ipName: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t.city}</label>
                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:border-emerald-500 px-3 py-1 transition-all">
                  <MapPin size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input 
                    type="text" 
                    placeholder={language === 'ru' ? "п. Осакаровка, с. Садовое" : "Осакаровка к., Садовое а."}
                    className="w-full bg-transparent py-3 text-xs font-semibold text-gray-800 border-none outline-none"
                    value={user?.city || ''} 
                    onChange={(e) => updateUser({ city: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address Details */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t.address}</label>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:border-emerald-500 px-3 py-1 transition-all">
                <MapPin size={14} className="text-gray-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder={language === 'ru' ? "Улица, дом, кв, ориентиры" : "Көше, үй, пәтер, бағыттар"}
                  className="w-full bg-transparent py-3 text-xs font-semibold text-gray-800 border-none outline-none"
                  value={user?.address || ''} 
                  onChange={(e) => updateUser({ address: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Actions button */}
          <button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-4 rounded-2xl text-xs font-extrabold cursor-pointer shadow-md transition-all mt-2 flex items-center justify-center"
            onClick={handleSave} 
            disabled={isSaving}
          >
            <span>{isSaving ? t.saving : t.saveChanges}</span>
          </button>
          
          <button 
            className="w-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600 py-3.5 rounded-2xl text-xs font-bold transition-all border border-transparent hover:border-rose-150 cursor-pointer" 
            onClick={logout}
          >
            {t.logout}
          </button>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {userOrders.length > 0 ? (
            userOrders.map(order => {
              const formattedDate = order.createdAt?.toDate()?.toLocaleDateString() || 'Недавно';
              const isPending = order.status === 'pending';
              
              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-exotic text-xs font-black tracking-tight text-gray-800 uppercase">
                        {t.order} #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Calendar size={11} />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isPending 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : 'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {isPending ? t.pending : t.delivered}
                      </span>
                      
                      <button 
                        onClick={() => handleRepeatClick(order.items)}
                        className="flex items-center gap-1 text-[10px] font-black tracking-wide text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer uppercase"
                      >
                        <RotateCcw size={10} className="stroke-[2.5]" />
                        <span>{t.repeat}</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* List of items inside order */}
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600 font-semibold max-h-[140px] overflow-y-auto divide-y divide-gray-50">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                        <span className="truncate pr-4 text-gray-700 font-bold text-xs">{item.title}</span>
                        <span className="text-gray-400 text-xs shrink-0">{item.quantity} {item.unit || 'шт'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100/60">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{language === 'ru' ? 'Итого' : 'Жиыны'}</span>
                    <span className="font-extrabold text-sm text-gray-800 tabular-nums">
                      {formatPrice(Math.round(order.totalPrice))}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 px-4 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center gap-3">
              <ShoppingBag className="text-gray-300" size={32} />
              <h3 className="text-sm font-bold text-gray-700">{t.noOrders}</h3>
              <p className="text-xs text-gray-400 max-w-[200px]">
                {t.noOrdersDesc}
              </p>
              <button 
                onClick={() => navigate('/catalog')}
                className="mt-2 flex items-center gap-1 bg-white hover:bg-gray-100 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <span>{language === 'ru' ? 'Перейти в каталог →' : 'Каталогқа өту →'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM REPEAT WINDOW */}
      {isRepeatModalOpen && selectedOrderItems && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-lg border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-200"
          >
            <h2 className="text-base font-black text-gray-800 leading-snug">
              {language === 'ru' ? 'Повторить этот заказ?' : 'Осы тапсырысты қайталау?'}
            </h2>
            <p className="text-xs text-gray-400 leading-normal">
              {language === 'ru' ? 'Все текущие товары в вашей корзине будут очищены, а товары из этого выбранного заказа будут скопированы прямо в корзину для мгновенного перезаказа.' : 'Себетіңіздегі барлық ағымдағы тауарлар жойылады, ал таңдалған тапсырыстағы тауарлар қайта тапсырыс беру үшін себетке көшіріледі.'}
            </p>
            <div className="flex gap-3 mt-1.5">
              <button 
                onClick={() => setIsRepeatModalOpen(false)}
                className="flex-grow py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? 'Отмена' : 'Болдырмау'}
              </button>
              <button 
                onClick={confirmRepeatOrder}
                className="flex-grow py-3 bg-emerald-505 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                {t.repeat}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
