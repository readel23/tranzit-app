import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CategoryPage from './pages/CategoryPage';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import SearchPage from './pages/Search';
import Admin from './pages/Admin';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

function AppContent() {
  const location = useLocation(); 
  
  // Decide what layers to show depending on active page
  const isAdmin = location.pathname === '/admin';
  const hideHeader = location.pathname === '/cart' || location.pathname === '/profile' || isAdmin;
  const hideMenu = isAdmin;

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-800 ${isAdmin ? 'p-0 bg-white' : 'py-0'}`}>
      
      {/* Centered card-container on desktop, fully fluid on mobile */}
      <div className={`w-full flex-grow flex flex-col mx-auto ${
        isAdmin 
          ? 'max-w-none' 
          : 'max-w-xl bg-white shadow-[0_0_30px_rgba(0,0,0,0.02)] min-h-screen border-x border-gray-100/50'
      }`}>
        
        {/* Render Header conditionally */}
        {!hideHeader && <Header />} 
        
        {/* Main Content Area */}
        <main className={`flex-grow ${isAdmin ? 'p-0' : 'px-4 py-5'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        
        {/* Render Footer conditionally */}
        {!hideMenu && <Footer />}
      </div>

      {/* Persistent Translucent Navigation Bottom-Bar */}
      {!hideMenu && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
