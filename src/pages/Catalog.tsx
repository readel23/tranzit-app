import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

const CATALOG_DATA = [
  {
    id: 1,
    title: "Овощи, фрукты, зелень",
    tagline: "Всегда сочные, хрустящие и свежие",
    slug: "vegetables-fruits",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500" 
  },
  {
    id: 2,
    title: "Молоко, сыр и яйца",
    tagline: "Натуральные молочные продукты каждый день",
    slug: "dairy",
    image: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 3,
    title: "Хлеб и выпечка",
    tagline: "Ароматный хлеб, сладости и элитный чай",
    slug: "bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 4,
    title: "Мясо и птица",
    tagline: "Сытные мясные деликатесы и консервы",
    slug: "meat",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=500"
  }
];

export default function Catalog() {
  const { language } = useLanguageStore();
  const t = translations[language];

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-10">
      <div className="flex flex-col gap-1.5 px-1 py-1">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{t.catalogTitle}</h1>
        <p className="text-xs text-gray-500">{t.catalogSubtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {CATALOG_DATA.map((category, idx) => {
          const localizedTitles: any = {
            "Овощи, фрукты, зелень": language === 'ru' ? "Овощи, фрукты, зелень" : "Көкөністер, жемістер, көк шөп",
            "Молоко, сыр и яйца": language === 'ru' ? "Молоко, сыр и яйца" : "Сүт, ірімшік және жұмыртқа",
            "Хлеб и выпечка": language === 'ru' ? "Хлеб и выпечка" : "Нан және пісірілген өнімдер",
            "Мясо и птица": language === 'ru' ? "Мясо и птица" : "Ет және құс"
          };
          const localizedTaglines: any = {
            "Всегда сочные, хрустящие и свежие": language === 'ru' ? "Всегда сочные, хрустящие и свежие" : "Әрқашан шырынды, қытырлақ және балғын",
            "Натуральные молочные продукты каждый день": language === 'ru' ? "Натуральные молочные продукты каждый день" : "Күн сайын табиғи сүт өнімдері",
            "Ароматный хлеб, сладости и элитный чай": language === 'ru' ? "Ароматный хлеб, сладости и элитный чай" : "Хош иісті нан, тәттілер және элиталық шай",
            "Сытные мясные деликатесы и консервы": language === 'ru' ? "Сытные мясные деликатесы и консервы" : "Тойымды ет деликатестері және консервілер"
          };

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="group"
            >
              <Link
                to={`/category/${category.slug}`}
                className="relative block w-full h-36 rounded-3xl overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-300 border border-gray-100"
              >
                {/* Background Image with subtle group hover zoom */}
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Overlay with rich gradient for beautiful typography rendering */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity group-hover:opacity-95" />
                
                {/* Overlay Content */}
                <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end text-white">
                  <div className="flex flex-col gap-1 pr-4">
                    <h3 className="text-base font-black tracking-tight leading-tight">
                      {localizedTitles[category.title] || category.title}
                    </h3>
                    <p className="text-[11px] text-gray-300 tracking-tight font-medium">
                      {localizedTaglines[category.tagline] || category.tagline}
                    </p>
                  </div>

                  {/* Visual action pill */}
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white text-white transition-all duration-300">
                    <ChevronRight size={16} className="stroke-[3]" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
