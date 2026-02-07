
import React, { useState, useRef } from 'react';
import { Table, Product, OrderItem, TableStatus, OrderStatus, ProductCategory } from '../types';
import { Users, CheckCircle, Coffee, Beer, Utensils, Printer, X, DollarSign, CreditCard, Smartphone, Grid, Map, GripVertical, ChevronLeft, ArrowRight } from 'lucide-react';

interface POSProps {
  tables: Table[];
  products: Product[];
  onUpdateTable: (table: Table) => void;
  onCloseTable: (table: Table, paymentMethod: string) => void;
}

export const POS: React.FC<POSProps> = ({ tables, products, onUpdateTable, onCloseTable }) => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito');

  const activeTable = tables.find(t => t.id === selectedTableId);

  const handleAddItem = (product: Product) => {
    if (!activeTable) return;
    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      status: OrderStatus.PENDING
    };
    onUpdateTable({ ...activeTable, items: [...activeTable.items, newItem], status: TableStatus.OCCUPIED, openedAt: activeTable.openedAt || Date.now() });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeTable) return;
    const newItems = [...activeTable.items];
    newItems.splice(index, 1);
    onUpdateTable({ ...activeTable, items: newItems });
  };

  const calculateTotal = (items: OrderItem[]) => items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const subtotal = activeTable ? calculateTotal(activeTable.items) : 0;
  const totalFinal = includeServiceFee ? subtotal * 1.1 : subtotal;

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 relative">
      {/* Coluna Mesas - Oculta no Mobile quando uma mesa está aberta */}
      <div className={`flex-1 flex flex-col ${selectedTableId ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Mapa de Mesas</h2>
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Grid size={18} /></button>
            <button onClick={() => setViewMode('MAP')} className={`p-2 rounded-lg transition-all ${viewMode === 'MAP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Map size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {tables.map(table => {
            const isOccupied = table.status !== TableStatus.FREE;
            return (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 aspect-square relative overflow-hidden
                  ${isOccupied ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100/50 shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}
                  ${selectedTableId === table.id ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
                `}
              >
                <span className="text-lg font-black">#{table.id}</span>
                {isOccupied ? (
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold uppercase opacity-60">Consumo</span>
                     <span className="font-bold">R$ {calculateTotal(table.items).toFixed(0)}</span>
                   </div>
                ) : (
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold">Livre</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comanda / Pedidos - Ocupa tela cheia no Mobile se aberta */}
      {selectedTableId && activeTable && (
        <div className="fixed md:static inset-0 z-40 bg-white md:bg-transparent md:flex md:flex-[2] flex flex-col animate-fade-in">
          {/* Header Mobile com Voltar */}
          <div className="p-4 bg-slate-900 md:bg-white md:border md:border-slate-200 md:rounded-t-2xl text-white md:text-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedTableId(null)} className="p-2 -ml-2 hover:bg-white/10 md:hidden rounded-full"><ChevronLeft /></button>
              <div>
                <h3 className="text-lg font-bold">Mesa #{activeTable.id}</h3>
                <p className="text-[10px] uppercase font-bold opacity-60">Comanda Ativa</p>
              </div>
            </div>
            <button onClick={() => setIsCheckoutOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20">Fechar Conta</button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 md:bg-white md:border-x md:border-slate-200">
            {/* Cardápio */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
              <div className="p-2 flex gap-2 overflow-x-auto bg-white border-b border-slate-100 no-scrollbar">
                <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>Tudo</button>
                {Object.values(ProductCategory).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.filter(p => selectedCategory === 'ALL' || p.category === selectedCategory).map(product => (
                  <button key={product.id} onClick={() => handleAddItem(product)} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-500 text-left flex justify-between items-center transition-all active:scale-95">
                    <div>
                      <span className="block font-bold text-slate-800 text-sm">{product.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{product.category}</span>
                    </div>
                    <span className="font-black text-blue-600">R${product.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Itens na Mesa */}
            <div className="w-full md:w-80 bg-slate-50 flex flex-col overflow-hidden">
               <div className="p-4 font-bold text-xs text-slate-400 uppercase tracking-widest bg-white/50">Itens Consumidos</div>
               <div className="flex-1 overflow-y-auto p-3 space-y-2">
                 {activeTable.items.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">Nenhum item lançado</div>
                 ) : (
                   activeTable.items.map((item, idx) => (
                     <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center animate-fade-in-up">
                       <div>
                         <span className="block font-bold text-slate-800 text-xs">{item.productName}</span>
                         <span className="text-[10px] text-slate-500">R$ {item.price.toFixed(2)}</span>
                       </div>
                       <button onClick={() => handleRemoveItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><X size={16} /></button>
                     </div>
                   ))
                 )}
               </div>
               <div className="p-4 bg-white border-t border-slate-200">
                 <div className="flex justify-between items-center text-slate-800 mb-2">
                   <span className="text-sm font-bold opacity-60">Subtotal</span>
                   <span className="text-xl font-black">R$ {subtotal.toFixed(2)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout Responsivo */}
      {isCheckoutOpen && activeTable && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-bottom md:animate-scale-in max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">Fechar Conta</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between mb-2"><span>Subtotal</span><span className="font-bold">R$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center mb-4 text-emerald-600">
                  <span className="text-sm flex items-center gap-2"><Utensils size={14}/> Serviço (10%)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={includeServiceFee} onChange={e => setIncludeServiceFee(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
                  <span className="font-bold text-slate-500 uppercase text-xs">Total a Pagar</span>
                  <span className="text-3xl font-black text-slate-800">R$ {totalFinal.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['Dinheiro', 'Cartão', 'Pix'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => { onCloseTable(activeTable, paymentMethod); setIsCheckoutOpen(false); setSelectedTableId(null); }}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
              >
                Confirmar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
