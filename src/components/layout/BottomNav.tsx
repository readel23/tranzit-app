import { NavLink } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { translations } from '../../i18n/translations';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav() {
  const items = useCartStore((state) => state.items);
  const { language } = useLanguageStore();
  const t = translations[language];
  
  // Count the total number of items in the cart (sum of quantities or unique positions)
  // Let's count active items length (unique product types) as requested
  const numberOfPositions = items.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center z-40 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.02)] max-w-xl mx-auto rounded-t-2xl">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center justify-center gap-1 w-1/4 h-full relative transition-colors duration-200 ${
            isActive ? 'text-emerald-505 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Home size={21} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] tracking-tight">{t.home}</span>
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator" 
                className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>

      <NavLink 
        to="/catalog" 
        className={({ isActive }) => 
          `flex flex-col items-center justify-center gap-1 w-1/4 h-full relative transition-colors duration-200 ${
            isActive ? 'text-emerald-505 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Grid size={21} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] tracking-tight">{t.catalog}</span>
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator" 
                className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>

      <NavLink 
        to="/cart" 
        className={({ isActive }) => 
          `flex flex-col items-center justify-center gap-1 w-1/4 h-full relative transition-colors duration-200 ${
            isActive ? 'text-emerald-505 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <ShoppingBag size={21} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              {numberOfPositions > 0 && (
                <motion.span 
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[15px] h-4 flex items-center justify-center border border-white"
                >
                  {numberOfPositions}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{t.cart}</span>
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator" 
                className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => 
          `flex flex-col items-center justify-center gap-1 w-1/4 h-full relative transition-colors duration-200 ${
            isActive ? 'text-emerald-505 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <User size={21} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] tracking-tight">{t.profile}</span>
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator" 
                className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>
    </nav>
  );
}
