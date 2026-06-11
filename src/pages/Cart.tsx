import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import products from '../db.json'; 
import ProductCard from '../components/ui/ProductCard'; 
import { 
  ShoppingCart, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle,
  MapPin // Добавлен импорт иконки MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCartStore();
  const { isLoggedIn, user } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  
  const totalPrice = getTotalPrice();
  const navigate = useNavigate();

  const [isProductsOpen, setIsProductsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirmation dialogs
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false); 
  const [comment, setComment] = useState('');
  
  // Custom recommendations based on admin configs
  const [recProducts, setRecProducts] = useState<any[]>([]);

  // Validation checking for business (IP) registration information or simple addresses 
  const isProfileIncomplete = isLoggedIn && (
    !user?.address || user.address.trim() === '' ||
    (user?.isIp && (
      !user?.ipName || user.ipName.trim() === '' ||
      !user?.city || user.city.trim() === ''
    ))
  );

  // Load recommendations matching settings doc
  useEffect(() => {
    const fetchRecProducts = async () => {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rIds = data.recIds || [];
          
          const cartIds = items.map(item => item.id);
          
          const rList = rIds
            .map((id: any) => products.find(p => Number(p.id) === Number(id)))
            .filter((p: any) => p !== undefined && !cartIds.includes(p.id));
          
          setRecProducts(rList.slice(0, 6)); // Show maximum 6 recommendations
        }
      } catch (error) {
        console.error("Ошибка загрузки рекомендаций в корзине:", error);
      }
    };
    fetchRecProducts();
  }, [items]);

  const handleConfirmClear = () => {
    clearCart();
    setIsClearModalOpen(false);
  };

  const handleCheckout = async () => {
    if (!auth.currentUser) return;

    if (isProfileIncomplete) {
      const hasNoAddress = !user?.address || user.address.trim() === '';
      alert(
        hasNoAddress 
          ? "Пожалуйста, укажите точный адрес доставки в вашем профиле." 
          : "Пожалуйста, укажите название вашего ИП и населенный пункт в профиле."
      );
      navigate('/profile');
      return;
    }
    
    setIsCheckoutModalOpen(false);
    setIsSubmitting(true);
    
    try {
      const orderData = {
        userId: auth.currentUser.uid,
        userPhone: user?.phone || '',
        userAddress: user?.address || '',
        userName: user?.isIp ? `${user?.ipName || 'ИП'} (${user?.city || ''})` : 'Частное лицо',
        items: items, 
        totalPrice: totalPrice,
        comment: comment.trim(), 
        status: 'pending', 
        createdAt: serverTimestamp(), 
      };

      await addDoc(collection(db, "orders"), orderData);
      
      alert("Заказ успешно оформлен! Наш оператор скоро свяжется с вами.");
      clearCart();
      navigate('/');
    } catch (error) {
      console.error("Ошибка при оформлении:", error);
      alert("Произошла ошибка при сохранении заказа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nice currency parser
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  // Empty cart component with nice illustration layout
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto min-h-[60vh] select-none">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100"
        >
          <ShoppingCart size={32} />
        </motion.div>
        <h2 className="text-lg font-black text-gray-800 tracking-tight">{language === 'ru' ? "Ваша корзина пуста" : "Себетіңіз бос"}</h2>
        <p className="text-xs text-gray-400 max-w-[240px] mt-2 mb-6">
          {language === 'ru' ? "Похоже, вы еще ничего не добавили. Перейдите в каталог продуктов, чтобы выбрать свежие продукты." : "Әлі ештеңе қоспаған сияқтысыз. Жаңа өнімдерді таңдау үшін каталогқа өтіңіз."}
        </p>
        <Link 
          to="/catalog" 
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3 px-8 rounded-xl text-xs transition-all shadow-sm"
        >
          <span>{language === 'ru' ? "В каталог" : "Каталогқа"}</span>
          <ArrowRight size={14} className="stroke-[3]" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-28 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-1 mt-2">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{t.yourCart}</h1>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{items.length} {t.positions}</span>
        </div>
        
        <button 
          onClick={() => setIsClearModalOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-black text-rose-500 hover:text-rose-600 cursor-pointer p-2 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={13} />
          <span>{t.clear}</span>
        </button>
      </div>

      {/* ITEMS ACCORDION WRAPPER */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm">
        <div 
          className="flex justify-between items-center cursor-pointer py-1" 
          onClick={() => setIsProductsOpen(!isProductsOpen)}
        >
          <span className="text-xs font-black text-gray-700 uppercase tracking-wider">{t.selectedProducts}</span>
          <span className={`text-xs text-neutral-400 font-bold transition-transform duration-300 ${isProductsOpen ? 'rotate-180' : ''}`}>
            ▲
          </span>
        </div>
        
        <AnimatePresence>
          {isProductsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-4 overflow-hidden"
            >
              <div className="pt-2 divide-y divide-gray-50 flex flex-col">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 relative group first:pt-0 last:pb-0">
                    {/* Compact absolute delete */}
                    <button 
                      className="absolute -top-1 -right-1 text-gray-300 hover:text-gray-500 p-1 rounded-full cursor-pointer transition-colors"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Удалить товар"
                    >
                      ×
                    </button>

                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden p-1 flex items-center justify-center shrink-0 border border-gray-100">
                      <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>

                    <div className="flex flex-col justify-between flex-grow min-w-0 pr-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-1 leading-normal">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          {formatPrice(item.price)} / {item.unit}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-2.5">
                        {/* Beautiful inline count selector */}
                        <div className="flex items-center bg-gray-100 text-gray-800 rounded-xl p-0.5 border border-gray-200">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white active:scale-90 transition-all cursor-pointer font-black"
                          >
                            −
                          </button>
                          <span className="text-xs font-black tracking-tight px-2 tabular-nums">
                            {item.quantity} шт
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white active:scale-90 transition-all cursor-pointer font-black"
                          >
                            +
                          </button>
                        </div>
                        
                        <span className="text-sm font-black text-gray-800 tabular-nums">
                          {formatPrice(Math.round(item.price * item.quantity))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FINAL RECEIPT TOTAL CARD */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-5 text-white flex justify-between items-center shadow-lg shadow-emerald-500/10">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
          {t.totalPrice}
        </span>
        <span className="text-2xl font-black tracking-tight tabular-nums">
          {formatPrice(Math.round(totalPrice))}
        </span>
      </div>

      {/* DELIVERY ADDRESS BLOCK */}
      <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
          {t.deliveryAddress}
        </span>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
            <MapPin size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-gray-800 leading-normal">
              {user 
                ? user.isIp && user.city
                  ? `${user.city}, ${user.address || ''}`.replace(/^,\s*/, '')
                  : user.address || t.notSpecified
                : t.notSpecified}
            </span>
            {user?.isIp && user?.ipName && (
              <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider mt-0.5">
                {t.organization}: {user.ipName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SPECIAL DELIVERY COMMENT BOX */}
      <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="text-gray-400 shrink-0" size={15} />
          <h4 className="text-xs font-extrabold text-gray-800 tracking-tight">{t.driverComment}</h4>
        </div>
        <textarea
          placeholder={t.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full p-3.5 rounded-2xl border border-gray-200 focus:border-emerald-500 outline-none text-xs leading-relaxed font-semibold transition-all resize-none bg-gray-50/50"
        />
      </div>

      {/* LOCAL RECOMMENDATIONS SLIDEOUT */}
      {recProducts.length > 0 && (
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center gap-1.5 px-1">
            <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-100">
              <Sparkles className="text-emerald-500 fill-emerald-50" size={13} />
            </div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">{t.mightBeUseful}</h3>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-1/5 scrollbar-none snap-x snap-mandatory">
            {recProducts.map((product) => (
              <div key={`rec-cart-${product.id}`} className="min-w-[145px] max-w-[145px] snap-start shrink-0">
                <ProductCard 
                  id={product.id}
                  image={product.image} 
                  title={product.title}
                  currentPrice={product.price}
                  unit={product.unit}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMPT ACTION TO AUTH DETAILS */}
      {!isLoggedIn && (
        <div className="bg-amber-50/80 border border-amber-100 rounded-3xl p-4 flex flex-col gap-2 mt-2">
          <div className="flex gap-2 items-start">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={17} />
            <div className="flex flex-col">
              <p className="text-xs font-bold text-amber-900 leading-tight">{t.authRequired}</p>
              <p className="text-[11px] text-amber-700/90 leading-normal mt-0.5">
                {t.authRequiredDesc}
              </p>
            </div>
          </div>
          <Link 
            to="/profile" 
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white py-2.5 rounded-xl text-xs font-extrabold text-center transition-all mt-1"
          >
            {t.loginBtn} →
          </Link>
        </div>
      )}

      {isLoggedIn && isProfileIncomplete && (
        <div className="bg-amber-50/80 border border-amber-100 rounded-3xl p-4 flex flex-col gap-2 mt-2">
          <div className="flex gap-2 items-start">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={17} />
            <div className="flex flex-col">
              <p className="text-xs font-bold text-amber-900 leading-tight">{t.profileIncomplete}</p>
              <p className="text-[11px] text-amber-700/90 leading-normal mt-0.5">
                {t.profileIncompleteDesc}
              </p>
            </div>
          </div>
          <Link 
            to="/profile" 
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white py-2.5 rounded-xl text-xs font-extrabold text-center transition-all mt-1"
          >
            {t.fillProfileBtn} →
          </Link>
        </div>
      )}

      {/* FLOAT CHECKOUT PANELS */}
      {isLoggedIn && (
        <div className="fixed bottom-16 left-0 right-0 max-w-xl mx-auto px-4 py-3 bg-white/85 backdrop-blur-md border-t border-gray-100 z-30 flex gap-3 rounded-t-3xl">
          <button 
            className="w-full py-4 rounded-2xl font-black text-xs flex justify-between items-center px-5 transition-all duration-300 shadow-md transform active:scale-95"
            onClick={isProfileIncomplete ? () => navigate('/profile') : () => setIsCheckoutModalOpen(true)}
            disabled={isSubmitting}
            style={{ 
              opacity: isSubmitting ? 0.7 : 1,
              backgroundColor: isProfileIncomplete ? '#94a3b8' : '#22c55e',
              color: '#ffffff',
            }}
          >
            <span className="tabular-nums font-extrabold text-sm">
              {isProfileIncomplete ? (language === 'ru' ? 'Инфо' : 'Ақпарат') : formatPrice(Math.round(totalPrice))}
            </span>
            <span className="tracking-wide uppercase font-black text-[11px] flex items-center gap-1">
              {isSubmitting 
                ? t.saving
                : isProfileIncomplete 
                  ? t.fillProfileBtn
                  : t.checkout}
              <ArrowRight size={13} className="stroke-[3]" />
            </span>
          </button>
        </div>
      )}

      {/* MODAL WINDOWS FOR CORRESPONDING DIALOG CONFIRMATIONS */}
      {/* 1. CLEAR CONFIRM */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-lg border border-gray-100 flex flex-col gap-4"
          >
            <h2 className="text-base font-black text-gray-800 leading-snug">
              {language === 'ru' ? 'Очистить всю корзину?' : 'Себетті толық тазалау?'}
            </h2>
            <p className="text-xs text-gray-400 leading-normal">
              {language === 'ru' ? 'Все добавленные продукты будут безвозвратно удалены. Оставить список покупок?' : 'Барлық қосылған өнімдер қайтарылмайтын болып жойылады. Сатып алу тізімін қалдыру керек пе?'}
            </p>
            <div className="flex gap-3 mt-1.5">
              <button 
                onClick={() => setIsClearModalOpen(false)}
                className="flex-grow py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? 'Оставить' : 'Қалдыру'}
              </button>
              <button 
                onClick={handleConfirmClear}
                className="flex-grow py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? 'Удалить всё' : 'Бәрін жою'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. CHECKOUT CONFIRM */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-lg border border-gray-100 flex flex-col gap-4"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1 border border-emerald-100">
              <ShoppingBag size={21} />
            </div>
            <h2 className="text-base font-black text-gray-800 leading-snug">
              {language === 'ru' ? 'Оформить заказ в TRANZIT?' : 'TRANZIT-те тапсырыс беру?'}
            </h2>
            <p className="text-xs text-gray-400 leading-normal">
              {language === 'ru' ? `Наш оператор получит детали вашего заказа (${formatPrice(Math.round(totalPrice))}) и мгновенно соберет его к отправке курьером.` : `Біздің оператор тапсырысыңыздың егжей-тегжейлерін (${formatPrice(Math.round(totalPrice))}) алады және оны курьермен жіберу үшін бірден жинайды.`}
            </p>
            <div className="flex gap-3 mt-1.5">
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-grow py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? 'Отмена' : 'Болдырмау'}
              </button>
              <button 
                onClick={handleCheckout}
                className="flex-grow py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? 'Подтвердить' : 'Растау'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}