import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import products from '../db.json'; 
import { ShoppingBag, Users, Settings, TrendingUp, AlertCircle, Trash2, Tag, PlusCircle, LayoutGrid, Sparkles } from 'lucide-react';

export default function Admin() {
  const [loading, setLoading] = useState(true); 
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false); 
  const ADMIN_UID = "Jho2I5itDxgk4D7ejJDgnxst8IT2";

  const [activeTab, setActiveTab] = useState('orders'); 
  const [orderFilter, setOrderFilter] = useState<'pending' | 'ready'>('pending');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'retail' | 'wholesale'>('all');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [promoIds, setPromoIds] = useState<number[]>([]);
  const [recIds, setRecIds] = useState<number[]>([]);
  const [newPromoId, setNewPromoId] = useState('');
  const [newRecId, setNewRecId] = useState('');
  const [addIdMap, setAddIdMap] = useState<{[key: string]: string}>({});

  // Новые стейты для управления баннерами в панели администратора
  const [banners, setBanners] = useState<any[]>([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerAction, setNewBannerAction] = useState('Смотреть');
  const [newBannerLink, setNewBannerLink] = useState('/catalog');
  const [newBannerIcon, setNewBannerIcon] = useState('☕');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setHasAccess(firebaseUser.uid === ADMIN_UID);
      } else {
        setUser(null);
        setHasAccess(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. Live stream of orders and users
  useEffect(() => {
    if (!hasAccess) return;

    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
    });

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, [hasAccess]);

  // 2. Main Storefront configurations 
  useEffect(() => {
    if (hasAccess && activeTab === 'home') {
      getDoc(doc(db, "settings", "homepage")).then(snap => {
        if (snap.exists()) {
          setPromoIds(snap.data().promoIds || []);
          setRecIds(snap.data().recIds || []);
          setBanners(snap.data().banners || []);
        }
      });
    }
  }, [hasAccess, activeTab]);

  const syncOrder = async (orderId: string, updatedItems: any[]) => {
    const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    await updateDoc(doc(db, "orders", orderId), {
      items: updatedItems,
      totalPrice: newTotal
    });
  };

  const handleQtyChange = (order: any, itemId: number, value: string) => {
    const newQty = parseFloat(value) || 0;
    const updated = order.items.map((item: any) => {
      if (item.id === itemId) return { ...item, quantity: newQty };
      return item;
    });
    syncOrder(order.id, updated);
  };

  const deleteItem = (order: any, itemId: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить товар из заказа?")) return;
    const updated = order.items.filter((i: any) => i.id !== itemId);
    syncOrder(order.id, updated);
  };

  const addItemToOrder = (order: any) => {
    const prodId = parseFloat(addIdMap[order.id] || "");
    if (!prodId) return;
    const productData = products.find(p => Number(p.id) === prodId);
    if (!productData) return alert("Продукт с таким кодом не найден в базе данных!");

    const exists = order.items.find((i: any) => i.id === prodId);
    let updated;
    if (exists) {
      updated = order.items.map((i: any) => i.id === prodId ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      updated = [...order.items, { ...productData, quantity: 1 }];
    }
    syncOrder(order.id, updated);
    setAddIdMap({ ...addIdMap, [order.id]: "" });
  };

  const toggleOrderStatus = async (orderId: string, currentStatus: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: currentStatus === 'pending' ? 'ready' : 'pending' });
  };

  const getUserDisplayName = (order: any) => {
    const client = users.find(u => u.id === order.userId);
    if (client) {
      if (client.isIp) {
        return `${client.ipName || 'ИП'} (${client.city || ''})`;
      }
      return 'Частное лицо';
    }
    return order.userName;
  };

  // CLIENTS FILTERING
  const filteredUsers = users.filter(u => {
    if (clientTypeFilter === 'retail') return !u.isIp;
    if (clientTypeFilter === 'wholesale') return u.isIp;
    return true;
  });

  // METRICS COMPUTATION
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const totalSalesVolume = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const wholesaleClientsCount = users.filter(u => u.isIp).length;

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  // Методы управления баннерами
  const handleAddBanner = () => {
    if (!newBannerTitle.trim() || !newBannerSubtitle.trim()) {
      alert("Заполните заголовок и описание баннера!");
      return;
    }
    const banner = {
      title: newBannerTitle.trim(),
      subtitle: newBannerSubtitle.trim(),
      action: newBannerAction.trim(),
      link: newBannerLink,
      icon: newBannerIcon.trim()
    };
    setBanners([...banners, banner]);
    
    // Очистка формы
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerAction('Смотреть');
    setNewBannerLink('/catalog');
    setNewBannerIcon('☕');
  };

  const handleRemoveBanner = (index: number) => {
    setBanners(banners.filter((_, idx) => idx !== index));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Проверка прав администратора...</span>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col items-center justify-center p-6 text-center select-none">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h1 className="text-xl font-black text-gray-800 tracking-tight">Доступ строго ограничен</h1>
        <p className="text-xs text-gray-400 max-w-[280px] mt-1.5 mb-6">
          Вы вошли в систему, но у вашей учетной записи нет достаточных прав для входа в панель распределения заказов.
        </p>
        <Link 
          to="/profile" 
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3 px-8 rounded-xl text-xs transition-all shadow-sm no-underline"
        >
          Войти под другой учетной записью
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-[5000] overflow-y-auto select-none font-sans text-gray-700">
      
      {/* GLORIOUS CONTROL DASHBOARD HEADER */}
      <header className="bg-slate-900 text-white shrink-0 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-505 text-white font-black flex items-center justify-center shadow-lg shadow-emerald-500/10 text-base">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none">TRANZIT MARKET</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Панель управления оператора</span>
            </div>
          </div>

          <nav className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50 gap-1">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`flex items-center gap-1.5 px-4  py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                activeTab === 'orders' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag size={14} />
              <span>Заказы</span>
            </button>
            <button 
              onClick={() => setActiveTab('clients')} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                activeTab === 'clients' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Клиенты</span>
            </button>
            <button 
              onClick={() => setActiveTab('home')} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                activeTab === 'home' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings size={14} />
              <span>Витрина</span>
            </button>
          </nav>

          <button 
            onClick={() => auth.signOut()} 
            className="bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border-0 outline-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* CORE OPERATIONS INNER VIEWPORT */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 w-full flex-grow flex flex-col gap-6 pb-20">
        
        {/* TAB 1: LIVE ORDERS DASHBOARD */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            
            {/* KPI METRIC CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-gray-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Всего заказов оформлено</span>
                  <span className="text-2xl font-black text-gray-800 tracking-tight mt-1">{formatPrice(totalSalesVolume)}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                  <TrendingUp size={20} />
                </div>
              </div>
              
              <div className="bg-white border border-gray-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Активные сборки заказов</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-2xl font-black text-gray-800 tracking-tight">{pendingOrders.length}</span>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border border-amber-300" />
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shrink-0">
                  <ShoppingBag size={20} />
                </div>
              </div>

              <div className="bg-white border border-gray-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Бизнес-клиенты (ИП)</span>
                  <span className="text-2xl font-black text-gray-800 tracking-tight mt-1">{wholesaleClientsCount} организаций</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Users size={20} />
                </div>
              </div>
            </div>

            {/* LIVE FILTERS AND ORDERS CONTROL */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Управление живой очередью заказов</h1>
                <p className="text-xs text-gray-500">Добавляйте позиции, регулируйте объемы или отправляйте заказы курьерам</p>
              </div>

              <div className="flex bg-gray-200/80 border border-gray-300/30 rounded-2xl p-1 shrink-0 w-full md:w-max">
                <button 
                  onClick={() => setOrderFilter('pending')} 
                  className={`flex-grow md:flex-grow-0 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border-none ${
                    orderFilter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Активные сборки ({pendingOrders.length})
                </button>
                <button 
                  onClick={() => setOrderFilter('ready')} 
                  className={`flex-grow md:flex-grow-0 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border-none ${
                    orderFilter === 'ready' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Архив доставок ({readyOrders.length})
                </button>
              </div>
            </div>

            {/* ORDER CARDS STREAM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.filter(o => o.status === orderFilter).map((order) => {
                const dateObj = order.createdAt?.toDate();
                const displayTime = dateObj ? dateObj.toLocaleString('ru-RU') : 'Недавно';

                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{displayTime}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <h3 className="text-base font-black text-slate-800 tracking-tight">ЗАКАЗ #{order.id.slice(-6).toUpperCase()}</h3>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                            orderFilter === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {orderFilter === 'pending' ? 'СБОРКА' : 'ЗАВЕРШЕН'}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => toggleOrderStatus(order.id, order.status)}
                        className={`border-0 outline-none px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
                          order.status === 'ready' 
                            ? 'bg-slate-100 hover:bg-slate-200 text-gray-600' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                        }`}
                      >
                        {order.status === 'ready' ? 'Вернуть в сборку' : 'Собрать и отправить'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50/70 border border-gray-200/50 rounded-2xl p-3.5 text-xs">
                      <div className="flex flex-col gap-1 min-w-0 pr-2 border-r border-gray-200/80">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Клиент доставки</span>
                        <span className="font-bold text-slate-800 truncate">{getUserDisplayName(order)}</span>
                        <a href={`tel:${order.userPhone}`} className="text-emerald-600 font-bold hover:underline">{order.userPhone}</a>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Адрес прибытия курьера</span>
                        <span className="font-semibold text-slate-600 leading-normal line-clamp-2" title={order.userAddress}>
                          {order.userAddress || 'Не указан'}
                        </span>
                      </div>
                    </div>

                    {order.comment && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs flex gap-2">
                        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-widest">Заметка для курьера</span>
                          <p className="text-amber-900 font-semibold leading-relaxed">{order.comment}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pt-1">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Содержимое корзины ({order.items?.length || 0} тов)</span>
                      
                      <div className="divide-y divide-gray-50 flex flex-col">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center py-2 gap-3 first:pt-0">
                            <span className="text-xs font-bold text-slate-700 truncate flex-grow">{item.title}</span>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              <input 
                                type="number" 
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleQtyChange(order, item.id, e.target.value)}
                                className="w-14 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-lg py-1 px-1.5 text-center text-xs font-bold text-slate-800 outline-none transition-colors"
                              />
                              <span className="text-xs font-black text-slate-800 tabular-nums min-w-[70px] text-right">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button 
                                onClick={() => deleteItem(order, item.id)} 
                                className="text-rose-400 hover:text-rose-600 bg-transparent border-0 outline-none cursor-pointer transition-colors p-1"
                                aria-label="Удалить позицию"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 bg-gray-50 border border-gray-150 border-dashed rounded-2xl p-2.5 mt-1.5 items-center">
                      <input 
                        type="number" 
                        placeholder="Код товара (ID)" 
                        value={addIdMap[order.id] || ""} 
                        onChange={(e) => setAddIdMap({ ...addIdMap, [order.id]: e.target.value })} 
                        className="flex-grow bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all" 
                      />
                      <button 
                        onClick={() => addItemToOrder(order)} 
                        className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white border-none py-2 px-4 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <PlusCircle size={13} />
                        <span>Добавить к заказу</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Общая сумма</span>
                      <span className="text-lg font-black text-slate-800 tracking-tight tabular-nums">
                        {formatPrice(Math.round(order.totalPrice))}
                      </span>
                    </div>
                  </div>
                );
              })}

              {orders.filter(o => o.status === orderFilter).length === 0 && (
                <div className="col-span-full text-center py-20 px-6 bg-white border border-gray-200 rounded-3xl flex flex-col items-center gap-2">
                  <ShoppingBag className="text-gray-300" size={32} />
                  <h3 className="text-sm font-bold text-gray-800">Заказы не поступали</h3>
                  <p className="text-xs text-gray-500">В данной корзине на текущий момент заказов нет.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTS GRID REGISTRATION DATABASE */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Реестр зарегистрированных пользователей ({users.length})</h1>
                <p className="text-xs text-gray-500">Живой список и профили покупателей TRANZIT в поселке</p>
              </div>

              <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 border border-gray-200/50">
                <button onClick={() => setClientTypeFilter('all')} className={`px-4 py-2 border-0 rounded-xl text-xs font-bold cursor-pointer transition-all ${clientTypeFilter === 'all' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'}`}>Все пользователи</button>
                <button onClick={() => setClientTypeFilter('retail')} className={`px-4 py-2 border-0 rounded-xl text-xs font-bold cursor-pointer transition-all ${clientTypeFilter === 'retail' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'}`}>Частные лица</button>
                <button onClick={() => setClientTypeFilter('wholesale')} className={`px-4 py-2 border-0 rounded-xl text-xs font-bold cursor-pointer transition-all ${clientTypeFilter === 'wholesale' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-200 bg-emerald-500/10'}`}>ТОО / ИП партнёры</button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-gray-700">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Телефон покупателя</th>
                    <th className="p-4">Категория</th>
                    <th className="p-4">Организация / ИП</th>
                    <th className="p-4">Населенный пункт</th>
                    <th className="p-4 pr-6">Адрес поставки</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700 leading-normal">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800 text-xs">
                        {u.phone || 'Не указан'}
                      </td>
                      <td className="p-4">
                        {u.isIp ? (
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded">
                            БИЗНЕС (ИП)
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded">
                            ФИЗ. ЛИЦО
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {u.isIp ? (u.ipName || '—') : '—'}
                      </td>
                      <td className="p-4">{u.city || 'п. Осакаровка'}</td>
                      <td className="p-4 pr-6 text-slate-500 truncate max-w-[220px]" title={u.address}>
                        {u.address || '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">
                        Партнёры в данной группе пока не зарегистрированы
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAROUSELL COVER & VITRINE EDITORS */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* LEFT COLUMN: PRODUCTS IDs GROUPS */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Управление товарами витрины</h2>
                <p className="text-xs text-gray-500 font-medium">Регулируйте ID выводимых товаров на главной странице</p>
              </div>

              <div className="flex flex-col gap-6 divide-y divide-gray-100">
                {/* SECTION: PROMO ID LISTS */}
                <section className="flex flex-col gap-3 py-2 first:pt-0">
                  <div className="flex items-center gap-1.5">
                    <Tag size={15} className="text-rose-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Группа "Супер-скидки"</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Код товара (ID)" 
                      value={newPromoId} 
                      onChange={e=>setNewPromoId(e.target.value)} 
                      className="flex-grow bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-all" 
                    />
                    <button 
                      onClick={() => { if(newPromoId) setPromoIds([...promoIds, Number(newPromoId)]); setNewPromoId(''); }} 
                      className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white border-none py-2 px-5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Вставить
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {promoIds.map(id => {
                      const prod = products.find(p => Number(p.id) === id);
                      return (
                        <div key={id} className="bg-gray-50 border border-gray-200 pl-3.5 pr-2 py-1.5 rounded-xl font-bold text-xs text-gray-700 flex items-center gap-2.5">
                          <span>#{id} {prod ? `(${prod.title.slice(0, 15)}...)` : ''}</span>
                          <span onClick={()=>setPromoIds(promoIds.filter(i=>i!==id))} className="cursor-pointer text-rose-500 hover:text-rose-700 p-0.5 text-base leading-none font-bold">✕</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION: RECOMMENDATIONS EDITORS */}
                <section className="flex flex-col gap-3 pt-6">
                  <div className="flex items-center gap-1.5">
                    <Tag size={15} className="text-amber-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Группа "Рекомендуем"</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Код товара (ID)" 
                      value={newRecId} 
                      onChange={e=>setNewRecId(e.target.value)} 
                      className="flex-grow bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-all" 
                    />
                    <button 
                      onClick={() => { if(newRecId) setRecIds([...recIds, Number(newRecId)]); setNewRecId(''); }} 
                      className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white border-none py-2 px-5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Вставить
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {recIds.map(id => {
                      const prod = products.find(p => Number(p.id) === id);
                      return (
                        <div key={id} className="bg-gray-50 border border-gray-200 pl-3.5 pr-2 py-1.5 rounded-xl font-bold text-xs text-gray-700 flex items-center gap-2.5">
                          <span>#{id} {prod ? `(${prod.title.slice(0, 15)}...)` : ''}</span>
                          <span onClick={()=>setRecIds(recIds.filter(i=>i!==id))} className="cursor-pointer text-rose-500 hover:text-rose-700 p-0.5 text-base leading-none font-bold">✕</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE HOME BANNER BUILDER */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <LayoutGrid size={18} className="text-emerald-500" />
                  <span>Интерактивный конструктор баннеров</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium">Создавайте, удаляйте или меняйте порядок баннеров на главном экране</p>
              </div>

              {/* Banner Creation Form */}
              <div className="bg-gray-50/70 border border-gray-200/50 rounded-2xl p-4 flex flex-col gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Новый баннер рекламы</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Заголовок (Главный текст)</label>
                    <input 
                      type="text" 
                      placeholder="Ароматный чай и сладости"
                      value={newBannerTitle}
                      onChange={e=>setNewBannerTitle(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Подзаголовок</label>
                    <input 
                      type="text" 
                      placeholder="Широкий выбор элитного чая"
                      value={newBannerSubtitle}
                      onChange={e=>setNewBannerSubtitle(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Текст на кнопке</label>
                    <input 
                      type="text" 
                      placeholder="Смотреть"
                      value={newBannerAction}
                      onChange={e=>setNewBannerAction(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Эмодзи иконка</label>
                    <input 
                      type="text" 
                      placeholder="☕"
                      maxLength={4}
                      value={newBannerIcon}
                      onChange={e=>setNewBannerIcon(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Куда переходить (Ссылка)</label>
                    <select
                      value={newBannerLink}
                      onChange={e=>setNewBannerLink(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="/catalog">Каталог товаров (Все)</option>
                      <option value="/category/bakery">Категория: Хлеб и Чай</option>
                      <option value="/category/dairy">Категория: Молоко, Сыр, Напитки</option>
                      <option value="/category/meat">Категория: Консервы и Мясо</option>
                      <option value="/category/vegetables-fruits">Категория: Пиво и Алкоголь</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddBanner}
                  className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white border-none py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1"
                >
                  <PlusCircle size={14} />
                  <span>Добавить баннер в список</span>
                </button>
              </div>

              {/* Banners List Queue */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Текущие слайды ({banners.length})</span>
                
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {banners.map((ban, idx) => (
                    <div key={idx} className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center relative border border-slate-800">
                      <div className="flex gap-3 items-center min-w-0">
                        <span className="text-3xl shrink-0">{ban.icon || '🎁'}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-emerald-400 uppercase font-black tracking-widest leading-none">Слайд {idx + 1}</span>
                          <span className="font-extrabold text-xs truncate mt-1 leading-normal">{ban.title}</span>
                          <span className="text-[10px] text-slate-400 truncate leading-relaxed">{ban.subtitle}</span>
                          <span className="text-[9px] text-slate-500 font-bold mt-1">Ссылка: {ban.link} | Кнопка: {ban.action}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveBanner(idx)}
                        className="text-rose-400 hover:text-rose-600 bg-slate-800 hover:bg-slate-700/80 p-2.5 rounded-xl cursor-pointer transition-colors border-none shrink-0"
                        title="Удалить слайд"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {banners.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 border border-gray-150 border-dashed rounded-2xl text-xs text-gray-400 font-bold">
                      Нет созданных баннеров. Добавьте первый слайд в форме выше.
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN GLOBAL STOREFRONT SYNC ACTION */}
              <button 
                onClick={() => {
                  setDoc(doc(db, "settings", "homepage"), { promoIds, recIds, banners, updatedAt: new Date() })
                    .then(() => alert("Витрина успешно обновлена! Новые промо-блоки и баннеры опубликованы на главной странице!"));
                }} 
                className="bg-emerald-505 hover:bg-emerald-600 active:scale-95 text-white py-4 rounded-2xl border-none font-extrabold text-xs cursor-pointer shadow-md transition-all mt-2 text-center shrink-0 uppercase tracking-widest flex items-center justify-center gap-1.5 w-full"
              >
                <Sparkles size={14} className="fill-white/20 animate-pulse" />
                <span>Сохранить и Синхронизировать витрину</span>
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}