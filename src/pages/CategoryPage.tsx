import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import products from '../db.json'; 
import { useSearchStore } from '../store/useSearchStore';
import { ChevronRight, SlidersHorizontal, ArrowUpDown, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_TITLES: Record<string, string> = {
  'vegetables-fruits': 'Овощи, фрукты, зелень',
  'dairy': 'Молоко, сыр и яйца',
  'bakery': 'Хлеб и выпечка',
  'meat': 'Мясо и птица'
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'vegetables-fruits': '🥦',
  'dairy': '🧀',
  'bakery': '🥐',
  'meat': '🥩'
};

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { searchQuery } = useSearchStore();
  
  const [sortOrder, setSortOrder] = useState('recommend');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');
  const [appliedPrice, setAppliedPrice] = useState({ min: 0, max: 999999 });

  const categoryProducts = useMemo(() => {
    if (!slug) return [];
    
    let filtered = products.filter(p => p.category === slug);

    // Search queries
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price query filters 
    filtered = filtered.filter(p => 
      p.price >= appliedPrice.min && p.price <= appliedPrice.max
    );

    // Sorting 
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    return filtered;
  }, [slug, sortOrder, searchQuery, appliedPrice]);

  const handleApplyFilter = () => {
    setAppliedPrice({
      min: tempMin === '' ? 0 : Number(tempMin),
      max: tempMax === '' ? 999999 : Number(tempMax)
    });
    setIsFilterOpen(false); // Close drawer on apply
  };

  const handleResetFilter = () => {
    setTempMin('');
    setTempMax('');
    setAppliedPrice({ min: 0, max: 999999 });
  };

  const title = slug && CATEGORY_TITLES[slug] ? CATEGORY_TITLES[slug] : 'Каталог товаров';
  const emoji = slug && CATEGORY_EMOJIS[slug] ? CATEGORY_EMOJIS[slug] : '📦';

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-10">
      
      {/* 1. BREADCRUMBS */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium px-1">
        <Link to="/catalog" className="hover:text-emerald-600 transition-colors">Каталог</Link>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-emerald-600 font-bold max-w-[150px] truncate">{title}</span>
      </nav>

      {/* 2. HEADER TITLE AND INDICATORS */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-2xl filter drop-shadow">{emoji}</span>
        <h1 className="text-xl font-black text-gray-800 tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      {/* 3. SORTING OPTIONS & TOGGLE FILTERS */}
      <div className="flex items-center justify-between gap-3 px-1 sticky top-[108px] z-20 bg-white py-1">
        {/* Sleek Selector */}
        <div className="relative flex-grow max-w-[65%]">
          <select 
            className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl py-2 px-4 pr-10 text-xs font-bold text-gray-700 outline-none transition-colors duration-200"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recommend">⭐ Рекомендуемые</option>
            <option value="asc">📉 Сначала дешевые</option>
            <option value="desc">📈 Сначала дорогие</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={13} />
        </div>

        {/* Filter Action Trigger */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            isFilterOpen 
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>Бюджет</span>
        </button>
      </div>

      {/* 4. EXPANDABLE FILTER CABINET (SMOOTH SLIDER) */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gray-50/80 rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 max-w-xl mx-auto w-full box-border"
          >
            <h3 className="text-xs font-bold text-gray-800 tracking-tight">Фильтр по стоимости (₸)</h3>
            
            <div className="flex items-center gap-3">
              <div className="flex-grow">
                <input 
                  type="number" 
                  placeholder="От 0 ₸" 
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-emerald-500 px-3 py-2 rounded-xl text-xs font-semibold outline-none transition-colors"
                />
              </div>
              <span className="text-xs text-gray-400 font-bold">до</span>
              <div className="flex-grow">
                <input 
                  type="number" 
                  placeholder="До 10 000 ₸" 
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-emerald-500 px-3 py-2 rounded-xl text-xs font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-1.5">
              <button 
                onClick={handleApplyFilter} 
                className="flex-grow bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Применить
              </button>
              <button 
                onClick={handleResetFilter} 
                className="px-4 bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-600 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Сбросить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. GRID DISPENSARY */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5">
          {categoryProducts.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              image={product.image} 
              title={product.title}
              currentPrice={product.price}
              unit={product.unit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center gap-3">
          <AlertCircle className="text-amber-500" size={32} />
          <h3 className="text-sm font-bold text-gray-800">Позиции не обнаружены</h3>
          <p className="text-xs text-gray-500 max-w-[280px]">
            {searchQuery 
              ? `По запросу "${searchQuery}" товаров не нашлось.` 
              : 'Нет товаров в данном ценовом диапазоне. Сбросьте диапазоны бюджетов.'}
          </p>
          <button 
            onClick={handleResetFilter}
            className="flex items-center gap-1 bg-white hover:bg-gray-100 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer active:scale-95 shadow-sm mt-2"
          >
            <RefreshCw size={12} className="text-gray-400" />
            <span>Сбросить бюджетный лимит</span>
          </button>
        </div>
      )}
    </div>
  );
}
