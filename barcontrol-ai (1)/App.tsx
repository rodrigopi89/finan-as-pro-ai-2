
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Archive, ChefHat, LogOut, Menu as MenuIcon, Smartphone, Users, Lock, X } from 'lucide-react';
import { StoreService } from './services/store';
import { Product, Table, Sale, TableStatus, User, UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Kitchen } from './components/Kitchen';
import { Kiosk } from './components/Kiosk';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';

const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
  { id: 'pos', label: 'PDV', icon: <ShoppingCart size={20} /> },
  { id: 'kitchen', label: 'Cozinha', icon: <ChefHat size={20} /> },
  { id: 'inventory', label: 'Estoque', icon: <Archive size={20} /> },
  { id: 'kiosk', label: 'Quiosque', icon: <Smartphone size={20} /> },
  { id: 'users', label: 'Equipe', icon: <Users size={20} /> },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setProducts(StoreService.getProducts());
    setTables(StoreService.getTables());
    setSales(StoreService.getSales());
  }, []);

  const handleUpdateTable = (updatedTable: Table) => {
    StoreService.updateTable(updatedTable);
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const handleCloseTable = (table: Table, paymentMethod: string) => {
    if (!currentUser) return;
    const total = table.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const sale: Sale = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      total,
      items: table.items,
      paymentMethod: paymentMethod,
      sellerId: currentUser.id,
      sellerName: currentUser.name
    };
    StoreService.addSale(sale);
    setSales(prev => [...prev, sale]);

    const newProducts = [...products];
    table.items.forEach(item => {
        const prodIndex = newProducts.findIndex(p => p.id === item.productId);
        if (prodIndex > -1) {
            newProducts[prodIndex].stock -= item.quantity;
            StoreService.saveProduct(newProducts[prodIndex]);
        }
    });
    setProducts(newProducts);
    handleUpdateTable({ ...table, status: TableStatus.FREE, items: [], openedAt: undefined });
  };

  const handleSaveProduct = (product: Product) => setProducts([...StoreService.saveProduct(product)]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.allowedViews.length > 0) setCurrentView(user.allowedViews[0]);
    else if (user.role === UserRole.ADMIN) setCurrentView('dashboard');
  };

  const handleLogout = () => { setCurrentUser(null); setSidebarOpen(false); };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  if (currentView === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
           <span className="font-black tracking-tighter text-xl">BarControl QUIOSQUE</span>
           <button onClick={() => setCurrentView('dashboard')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-auto"><Kiosk products={products} tables={tables} onUpdateTable={handleUpdateTable} /></div>
      </div>
    );
  }

  const menuItems = ALL_MENU_ITEMS.filter(item => currentUser.role === UserRole.ADMIN || currentUser.allowedViews.includes(item.id));

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Drawer Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar / Navigation */}
      <aside className={`
        fixed lg:static top-0 left-0 z-[70] h-full w-72 bg-slate-900 text-white transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 border-b border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">B</div>
          <div>
            <span className="text-xl font-black tracking-tighter block leading-none">BarControl</span>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 block">{currentUser.role}</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-1 mt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`transition-colors ${currentView === item.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'}`}>{item.icon}</div>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-blue-400">
               {currentUser.name.substring(0,2).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-black truncate text-slate-200">{currentUser.name}</p>
               <p className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">Status: Ativo</p>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-rose-900/20 hover:bg-rose-600 text-rose-400 hover:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-950/20 border border-rose-900/30">
             <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header Mobile-Only */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 z-50">
           <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
             <MenuIcon size={24} />
           </button>
           <span className="font-black tracking-tighter text-lg text-slate-800">BARCONTROL</span>
           <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-xs text-blue-600">
             {currentUser.name.substring(0,2).toUpperCase()}
           </div>
        </header>

        {/* View Container with Safe Area Insets */}
        <div className="flex-1 overflow-auto bg-slate-50/50 relative">
          <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto h-full">
            {currentView === 'dashboard' && <Dashboard sales={sales} products={products} />}
            {currentView === 'pos' && <POS tables={tables} products={products} onUpdateTable={handleUpdateTable} onCloseTable={handleCloseTable} />}
            {currentView === 'kitchen' && <Kitchen tables={tables} onUpdateTable={handleUpdateTable} />}
            {currentView === 'inventory' && <Inventory products={products} onSaveProduct={handleSaveProduct} />}
            {currentView === 'users' && currentUser.role === UserRole.ADMIN && <UserManagement currentUser={currentUser} />}
            
            {!menuItems.find(i => i.id === currentView) && currentView !== 'dashboard' && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
                 <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100"><Lock size={48} className="text-slate-200" /></div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
                    <p className="text-sm">Contate o administrador para permissões.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
