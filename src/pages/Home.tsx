import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import Skeleton from '../components/ui/Skeleton';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';
import products from '../db.json'; 
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, ShoppingBag, Flame, Star, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryPill {
  title: string;
  slug: string;
  emoji: string;
  gradient: string;
}

const QUICK_CATEGORIES: CategoryPill[] = [
  { title: "Овощи & Зелень", slug: "vegetables-fruits", emoji: "🥦", gradient: "from-green-500/10 to-emerald-500/10 text-emerald-700" },
  { title: "Молоко & Яйца", slug: "dairy", emoji: "🧀", gradient: "from-amber-500/10 to-orange-500/10 text-amber-800" },
  { title: "Хлеб & Чай", slug: "bakery", emoji: "🥐", gradient: "from-yellow-500/10 to-amber-500/10 text-yellow-800" },
  { title: "Мясо & Птица", slug: "meat", emoji: "🥩", gradient: "from-rose-500/10 to-red-500/10 text-rose-700" }
];

export default function Home() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [recProducts, setRecProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Состояние для динамических баннеров с дефолтными значениями по умолчанию
  const [banners, setBanners] = useState<any[]>([
    { title: language === 'ru' ? "Свежие продукты с доставкой" : "Жаңа өнімдерді жеткізу", subtitle: language === 'ru' ? "Привезем в п. Осакаровка в течение дня" : "Осакаровка к. күні бойы жеткіземіз", action: t.goToCatalog, link: "/catalog", icon: "🚀" },
    { title: language === 'ru' ? "Ароматный чай и сладости" : "Хош иісті шай және тәттілер", subtitle: language === 'ru' ? "Широкий выбор элитного пакетированного чая" : "Элиталық пакеттелген шайдың кең таңдауы", action: t.view, link: "/category/bakery", icon: "☕" }
  ]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Загрузка промо-продуктов
          const pIds = data.promoIds || [];
          const pList = pIds
            .map((id: any) => products.find(p => Number(p.id) === Number(id)))
            .filter((p: any) => p !== undefined);
          setPromoProducts(pList);

          // Загрузка рекомендуемых продуктов
          const rIds = data.recIds || [];
          const rList = rIds
            .map((id: any) => products.find(p => Number(p.id) === Number(id)))
            .filter((p: any) => p !== undefined);
          setRecProducts(rList);

          // Загрузка динамических баннеров из Firestore
          if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
            setBanners(data.banners);
          }
        } else {
          setPromoProducts(products.slice(0, 4));
          setRecProducts(products.slice(4, 10));
        }
      } catch (e) {
        console.error("Ошибка при загрузке главной:", e);
        setPromoProducts(products.slice(0, 4));
        setRecProducts(products.slice(4, 10));
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="flex flex-col gap-6 select-none max-w-xl mx-auto pb-10">
      
      {/* 1. HERO BANNER CAROUSEL */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-green-950 rounded-3xl p-5 text-white shadow-lg shadow-emerald-955/10 mt-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl" />
          
          <div className="relative z-10 flex flex-col gap-4 min-h-[110px] justify-between">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1 pr-2">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-emerald-400 bg-emerald-900/50 border border-emerald-800 px-2 py-0.5 rounded-full inline-block w-max">
                  {t.tranzitDelivery}
                </span>
                <motion.h2 
                  key={currentBanner}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-black leading-tight tracking-tight mt-1 max-w-[240px]"
                >
                  {banners[currentBanner]?.title}
                </motion.h2>
                <p className="text-xs text-emerald-200/90 leading-normal max-w-[260px]">
                  {banners[currentBanner]?.subtitle}
                </p>
              </div>
              <span className="text-4xl filter drop-shadow select-none shrink-0">
                {banners[currentBanner]?.icon || '🎁'}
              </span>
            </div>

            <div className="flex justify-between items-center mt-2">
              {/* Banner Dots indicator */}
              <div className="flex gap-1.5">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentBanner ? 'bg-emerald-400 w-3' : 'bg-emerald-800'
                    }`} 
                  />
                ))}
              </div>

              <button 
                onClick={() => navigate(banners[currentBanner]?.link || '/catalog')}
                className="flex items-center gap-1 bg-white text-emerald-900 px-3.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer shadow hover:bg-emerald-50 transition-all active:scale-95 border-none outline-none"
              >
                <span>{banners[currentBanner]?.action || 'Смотреть'}</span>
                <ChevronRight size={12} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK CATEGORY PILLS */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">{t.categories}</h3>
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200">
          {QUICK_CATEGORIES.map((cat, idx) => {
             // Localize category titles
             const localizedTitles: any = {
               "Овощи & Зелень": language === 'ru' ? "Овощи & Зелень" : "Көкөністер & Көк шөп",
               "Молоко & Яйца": language === 'ru' ? "Молоко & Яйца" : "Сүт & Жұмыртқа",
               "Хлеб & Чай": language === 'ru' ? "Хлеб & Чай" : "Нан & Шай",
               "Мясо & Птица": language === 'ru' ? "Мясо & Птица" : "Ет & Құс"
             };
             return (
               <button
                 key={idx}
                 onClick={() => navigate(`/category/${cat.slug}`)}
                 className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r ${cat.gradient} border border-gray-100 font-black text-xs whitespace-nowrap cursor-pointer active:scale-95 transition-all shadow-sm`}
               >
                 <span className="text-sm">{cat.emoji}</span>
                 <span>{localizedTitles[cat.title] || cat.title}</span>
               </button>
             );
          })}
        </div>
      </div>

      {/* 3. PROMO DISCOUNTS COLLECTION */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col gap-3 h-60">
                <Skeleton className="w-full aspect-square" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        promoProducts.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                  <Flame className="text-rose-500 fill-rose-500" size={16} />
                </div>
                <h2 className="text-base font-black text-gray-800 tracking-tight">
                  {t.superDiscounts}
                </h2>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-2 py-0.5 rounded-full border border-rose-100">
                {t.hotPrices}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {promoProducts.map((product) => (
                <ProductCard 
                  key={`promo-${product.id}`}
                  id={product.id}
                  image={product.image} 
                  title={product.title}
                  currentPrice={product.price}
                  unit={product.unit}
                />
              ))}
            </div>
          </div>
        )
      )}

      {/* 4. RECOMMENDATIONS COLLECTION */}
      {!loading && recProducts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100">
              <Star className="text-amber-500 fill-amber-500" size={16} />
            </div>
            <h2 className="text-base font-black text-gray-800 tracking-tight">
              {t.recommend}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {recProducts.map((product) => (
              <ProductCard 
                key={`rec-${product.id}`}
                id={product.id}
                image={product.image} 
                title={product.title}
                currentPrice={product.price}
                unit={product.unit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback if inventory is empty */}
      {!loading && promoProducts.length === 0 && recProducts.length === 0 && (
        <div className="text-center p-12 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center gap-2">
          <ShoppingBag className="text-gray-300" size={40} />
          <p className="text-xs font-bold text-gray-500">{t.soldOut}</p>
          <button 
            onClick={() => navigate('/catalog')} 
            className="text-xs font-bold text-emerald-600 underline mt-1"
          >
            {t.goToCatalog}
          </button>
        </div>
      )}
    </div>
  );
}