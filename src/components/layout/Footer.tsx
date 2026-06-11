import { Phone, Mail, Instagram, MessageCircle, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100 px-6 pt-8 pb-24 mt-12 flex flex-col gap-8 rounded-t-3xl max-w-xl mx-auto">
      {/* Brand & Guarantee badge */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tracking-tighter text-gray-800">
            TRANZIT
          </span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 roundedbg-emerald-50 text-emerald-600 border border-emerald-100">
            MARKET
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Быстрая и аккуратная доставка свежих продуктов, бакалеи, напитков и других товаров.
        </p>
      </div>

      {/* Quality commitment */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
        <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-xs font-bold text-gray-800 mb-0.5">Гарантия качества продуктов</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Мы лично проверяем сроки годности и свежесть каждого товара перед отправкой курьером.
          </p>
        </div>
      </div>

      {/* Structured contact widgets */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Время работы</span>
          <p className="text-xs font-semibold text-gray-700">Ежедневно с 09:00 до 18:00</p>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Телефон службы доставки</span>
          <a 
            href="tel:+77074708325" 
            className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Phone size={14} />
            <span>+7 (707) 470 83 25</span>
          </a>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Электронная почта</span>
          <a 
            href="mailto:tranzitmarket6@gmail.com" 
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Mail size={14} className="text-gray-400" />
            <span>tranzitmarket6@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Social action row */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Присоединяйтесь к нам</span>
        <div className="flex gap-3">
          {/* Instagram Link */}
          <a 
            href="https://www.instagram.com/tranzit_osk" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-all duration-200 shadow-sm"
            aria-label="Instagram"
          >
            <Instagram size={16} className="text-pink-500" />
            <span>Instagram</span>
          </a>
          
          {/* WhatsApp Link */}
          <a 
            href="https://wa.me/77074708325" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-all duration-200 shadow-sm"
            aria-label="WhatsApp"
          >
            <MessageCircle size={16} className="text-emerald-500 fill-emerald-50" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] text-gray-400">
        <span>© {currentYear} Tranzit Market. Все права защищены.</span>
      </div>
    </footer>
  );
}
