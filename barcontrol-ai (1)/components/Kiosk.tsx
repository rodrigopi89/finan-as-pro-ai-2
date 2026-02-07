import React, { useState, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { Product, Table, OrderItem, OrderStatus, ProductCategory, TableStatus } from '../types';
import { ShoppingBag, ChevronLeft, Plus, Minus, Send, Image as ImageIcon, QrCode, X, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface KioskProps {
  products: Product[];
  tables: Table[];
  onUpdateTable: (table: Table) => void;
}

type SortOption = 'NAME' | 'PRICE_ASC' | 'PRICE_DESC';

export const Kiosk: React.FC<KioskProps> = ({ products, tables, onUpdateTable }) => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Advanced Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('NAME');

  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        status: OrderStatus.PENDING
      }]);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCart(updatedCart);
  };

  const handlePlaceOrder = () => {
    if (!selectedTableId) return;
    
    const table = tables.find(t => t.id === selectedTableId);
    if (table) {
      const updatedTable = {
        ...table,
        status: TableStatus.OCCUPIED, // Garante que a mesa fique Ocupada
        items: [...table.items, ...cart],
        openedAt: table.openedAt || Date.now() // Define data de abertura se não existir
      };
      onUpdateTable(updatedTable);
      setIsOrderPlaced(true);
      
      // Limpa o carrinho e reseta para a tela inicial após 3 segundos
      setTimeout(() => {
        setCart([]);
        setIsOrderPlaced(false);
        setSelectedTableId(null);
      }, 3000);
    }
  };

  // Advanced Filtering Logic
  const processedProducts = useMemo(() => {
    let result = products;

    // 1. Category Filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    // 3. Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_ASC':
          return a.price - b.price;
        case 'PRICE_DESC':
          return b.price - a.price;
        case 'NAME':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (!selectedTableId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 text-center">Bem-vindo!</h1>
        <p className="text-slate-400 mb-8 text-center">Toque na sua mesa para começar o pedido.</p>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-2xl">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className="aspect-square bg-slate-800 hover:bg-blue-600 rounded-xl flex flex-col items-center justify-center transition-all border border-slate-700"
            >
              <span className="text-2xl font-bold">#{table.id}</span>
              <span className="text-xs text-slate-400 mt-1">{table.status}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-green-600 text-white p-6 animate-scale-in">
        <div className="bg-white text-green-600 p-6 rounded-full mb-6">
          <Send size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Pedido Enviado!</h1>
        <p className="text-green-100 text-center">A cozinha já está preparando suas delícias.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row bg-slate-50 gap-0 md:gap-6 overflow-hidden relative">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200">
        
        {/* Header & Categories */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col gap-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button onClick={() => setSelectedTableId(null)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <ChevronLeft />
                </button>
                <button 
                    onClick={() => setShowQR(true)} 
                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors"
                    title="Mostrar QR Code da Mesa"
                >
                    <QrCode />
                </button>
            </div>
            
            <div className="flex-1 overflow-x-auto scrollbar-hide ml-2">
                <div className="flex gap-2">
                    <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Tudo</button>
                    {Object.values(ProductCategory).map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{cat}</button>
                    ))}
                </div>
            </div>
          </div>

          {/* Advanced Filter Bar */}
          <div className="flex gap-3">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar no cardápio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
             </div>
             
             <div className="relative group">
                <button className="h-full px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                   <ArrowUpDown size={16} />
                   <span className="hidden sm:inline">Ordenar</span>
                </button>
                
                {/* Dropdown for Sort */}
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block z-20 animate-fade-in">
                    <button onClick={() => setSortBy('NAME')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortBy === 'NAME' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'}`}>
                        Padrão (A-Z)
                    </button>
                    <button onClick={() => setSortBy('PRICE_ASC')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortBy === 'PRICE_ASC' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'}`}>
                        Menor Preço
                    </button>
                    <button onClick={() => setSortBy('PRICE_DESC')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortBy === 'PRICE_DESC' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'}`}>
                        Maior Preço
                    </button>
                </div>
             </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {processedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <SlidersHorizontal size={48} className="mb-4" />
                <p className="text-lg font-medium">Nenhum item encontrado</p>
                <p className="text-sm">Tente mudar a categoria ou sua busca.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                  className="mt-4 text-blue-600 hover:underline font-medium"
                >
                  Limpar filtros
                </button>
            </div>
          ) : (
             <>
               <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{processedProducts.length} itens encontrados</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {processedProducts.map(product => (
                   <div key={product.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col group">
                     <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                          R$ {product.price.toFixed(2)}
                        </div>
                     </div>
                     <div className="p-4 flex-1 flex flex-col">
                       <h3 className="font-bold text-slate-800 mb-1">{product.name}</h3>
                       <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{product.description}</p>
                       <button 
                         onClick={() => handleAddToCart(product)}
                         className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                       >
                         Adicionar
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </>
          )}
        </div>
      </div>

      {/* Cart Area */}
      <div className={`
        fixed bottom-0 left-0 w-full h-[60vh] bg-white rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 transform 
        md:static md:w-96 md:h-full md:transform-none md:rounded-xl md:border md:border-slate-200 md:shadow-none z-30
        ${cart.length > 0 ? 'translate-y-0' : 'translate-y-[calc(100%-80px)] md:translate-y-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Handle for mobile */}
          <div className="md:hidden w-full flex justify-center py-3 bg-slate-50 border-b border-slate-100 rounded-t-2xl" onClick={() => {}}>
             <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 md:rounded-t-xl">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-slate-800" />
              <span className="font-bold text-lg">Seu Pedido</span>
            </div>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-sm font-bold">{cart.length} itens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                 <ShoppingBag size={48} className="mb-2" />
                 <p>Sua bandeja está vazia</p>
               </div>
             ) : (
               cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                   <div className="flex-1">
                     <div className="font-medium text-slate-800">{item.productName}</div>
                     <div className="text-xs text-slate-500">R$ {(item.price * item.quantity).toFixed(2)}</div>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                     <button onClick={() => handleUpdateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"><Minus size={12} /></button>
                     <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                     <button onClick={() => handleUpdateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded shadow-sm"><Plus size={12} /></button>
                   </div>
                 </div>
               ))
             )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 md:rounded-b-xl">
             <div className="flex justify-between items-center mb-4">
               <span className="text-slate-500">Total</span>
               <span className="text-2xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
             </div>
             <button 
               onClick={handlePlaceOrder}
               disabled={cart.length === 0}
               className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
             >
               Confirmar Pedido
             </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowQR(false)}>
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Mesa #{selectedTableId}</h2>
                <p className="text-slate-500 text-center mb-6 text-sm">Escaneie para acessar o cardápio</p>
                
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm mb-4">
                    <QRCode 
                        value={`https://barcontrol-demo.app/table/${selectedTableId}`} 
                        size={220}
                        viewBox={`0 0 256 256`}
                        className="w-full h-auto"
                        level="H"
                    />
                </div>
                
                <div className="bg-slate-50 px-4 py-2 rounded-lg text-xs font-mono text-slate-500 border border-slate-200 w-full text-center break-all">
                   barcontrol-demo.app/table/{selectedTableId}
                </div>
                
                <p className="mt-6 text-xs text-slate-400 text-center max-w-[200px]">
                    Compartilhe este código para que outros clientes façam pedidos juntos.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};