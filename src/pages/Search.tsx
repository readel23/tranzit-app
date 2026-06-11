import { useMemo } from 'react';
import { useSearchStore } from '../store/useSearchStore';
import products from '../db.json';
import ProductCard from '../components/ui/ProductCard';
import { Search, Info, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SearchPage() {
  const { searchQuery } = useSearchStore();

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return products.filter(product => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-10 select-none">
      
      {/* Search outcome label header */}
      <div className="flex flex-col gap-1.5 mt-2 px-1">
        <h1 className="text-xl font-black text-gray-800 tracking-tight leading-tight">
          {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Что будем искать сегодня?'}
        </h1>
        {searchQuery.trim() !== '' && (
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none">
            Найдено {filteredProducts.length} товаров
          </span>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5">
          {filteredProducts.map((product) => (
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
        <div className="text-center py-16 px-4 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-300 border border-gray-100">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-bold text-gray-700">Ничего не найдено</h3>
          <p className="text-xs text-gray-400 max-w-[280px]">
            {searchQuery 
              ? "Попробуйте ввести другие ключевые слова или сократить запрос (например: 'чай', 'пепси', 'казы')." 
              : "Введите название любимого напитка, свежих продуктов или чая в поиске выше."}
          </p>
          
          {/* Helpful suggestions tips card */}
          <div className="bg-white border border-gray-100/60 p-4 rounded-2xl flex gap-2 w-max max-w-xs text-left shadow-sm mt-3">
            <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[10px] font-bold text-gray-800 mb-0.5">Популярные запросы</h4>
              <p className="text-[10px] text-gray-400 leading-normal">
                Попробуйте поискать: чай, хаома, пепси, казы, кублей, кока-кола.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
