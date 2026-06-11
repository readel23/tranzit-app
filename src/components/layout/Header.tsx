import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchStore } from '../../store/useSearchStore';
import { Search, X } from 'lucide-react'; // MapPin удален

export default function Header() {
  const { searchQuery, setSearchQuery } = useSearchStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim() !== '') {
        navigate('/search');
      }
    }
  };

  const handleFocus = () => {
    if (location.pathname !== '/search') {
      navigate('/search');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-sm transition-all duration-300">
      <div className="max-w-xl mx-auto flex flex-col gap-2">
        {/* Top bar with Branding */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-exotic text-xl font-black bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent tracking-tighter">
              TRANZIT
            </span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-gray-400 pointer-events-none" size={17} />
          <input 
            type="text" 
            placeholder="Искать любимые продукты..." 
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border-0 bg-gray-100 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-55 focus:shadow-sm outline-none transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
          />
          {searchQuery && (
            <button 
              onClick={clearSearch} 
              className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors"
              aria-label="Очистить поиск"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}