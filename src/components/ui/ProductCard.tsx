import { useCartStore } from '../../store/useCartStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { translations } from '../../i18n/translations';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  key?: any;
  id: number;
  image: string;
  title: string;
  currentPrice: number;
  unit: string;
}

export default function ProductCard({ id, image, title, currentPrice, unit }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const items = useCartStore((state) => state.items);
  const { language } = useLanguageStore();
  const t = translations[language];

  const cartItem = items.find((item) => item.id === id);

  const handleAdd = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    addToCart({ id, image, title, price: currentPrice, unit });
  };

  const handleIncrease = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    updateQuantity(id, 1);
  };

  const handleDecrease = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(id, -1);
    } else {
      removeFromCart(id);
    }
  };

  // Helper to format Kazakh Tenge prices nicely (e.g. 1 050 ₸)
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between h-full hover:shadow-md hover:border-emerald-100 transition-all duration-300 relative group overflow-hidden"
    >
      {/* Product Image and Hover Zoom */}
      <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center p-2 shrink-0">
        <img 
          src={image || fallbackImage} 
          alt={title} 
          loading="lazy" 
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { 
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage; 
          }} 
        />
        
        {/* Unit Badge */}
        <span className="absolute top-2 left-2 text-[10px] bg-white/90 backdrop-blur-sm shadow-sm text-gray-500 font-bold px-2 py-0.5 rounded-full border border-gray-100">
          1 {unit === 'кг' ? t.kg : t.unit}
        </span>
      </div>

      {/* Info Container */}
      <div className="flex flex-col gap-1.5 flex-grow justify-between min-w-0">
        <div>
          <h3 className="text-xs font-bold text-gray-800 line-clamp-2 h-8 leading-tight tracking-tight hover:text-emerald-600 transition-colors cursor-pointer" title={title}>
            {title}
          </h3>
        </div>

        {/* Pricing & Cart controls row */}
        <div className="flex flex-col gap-2 mt-2 w-full">
          <div>
            <span className="text-sm font-black text-gray-800 tracking-tight">
              {formatPrice(currentPrice)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {cartItem ? (
              <motion.div 
                key="quantity-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center justify-between bg-emerald-50 text-emerald-700 rounded-xl p-1 w-full border border-emerald-100"
              >
                {/* Decrease Button */}
                <button 
                  onClick={handleDecrease}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-colors cursor-pointer text-emerald-600 focus:outline-none"
                  aria-label="Уменьшить количество"
                >
                  <Minus size={13} className="stroke-[2.5]" />
                </button>
                
                {/* Quantity value with small animation on update */}
                <motion.span 
                  key={cartItem.quantity}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xs font-black tracking-tight px-1 tabular-nums min-w-[2.5rem] text-center"
                >
                  {cartItem.quantity} {unit === 'кг' ? t.kg : t.unit}
                </motion.span> 
                
                {/* Increase Button */}
                <button 
                  onClick={handleIncrease}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-100/50 active:bg-emerald-200/50 transition-colors cursor-pointer text-emerald-600 focus:outline-none"
                  aria-label="Увеличить количество"
                >
                  <Plus size={13} className="stroke-[2.5]" />
                </button>
              </motion.div>
            ) : (
              <motion.button 
                key="add-to-cart-button"
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="w-full h-9 bg-gray-50 hover:bg-emerald-55 border border-gray-100 hover:border-emerald-200 text-emerald-600 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>{t.add}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
