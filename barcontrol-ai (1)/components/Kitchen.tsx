
import React, { useState } from 'react';
import { Table, OrderStatus } from '../types';
import { ChefHat, Utensils, Clock, CheckCircle, Bell, ChevronRight } from 'lucide-react';

interface KitchenProps {
  tables: Table[];
  onUpdateTable: (table: Table) => void;
}

export const Kitchen: React.FC<KitchenProps> = ({ tables, onUpdateTable }) => {
  const [activeTab, setActiveTab] = useState<'PREPARING' | 'READY' | 'HISTORY'>('PREPARING');
  
  const handleAdvanceStatus = (table: Table, itemIndex: number) => {
    const newItems = [...table.items];
    const item = newItems[itemIndex];
    if (item.status === OrderStatus.PENDING) item.status = OrderStatus.PREPARING;
    else if (item.status === OrderStatus.PREPARING) item.status = OrderStatus.READY;
    else if (item.status === OrderStatus.READY) item.status = OrderStatus.DELIVERED;
    onUpdateTable({ ...table, items: newItems });
  };

  const preparingItems = tables.flatMap(t => t.items.filter(i => [OrderStatus.PENDING, OrderStatus.PREPARING].includes(i.status)).map(i => ({ ...i, tableId: t.id, table: t })));
  const readyItems = tables.flatMap(t => t.items.filter(i => i.status === OrderStatus.READY).map(i => ({ ...i, tableId: t.id, table: t })));
  const deliveredItems = tables.flatMap(t => t.items.filter(i => i.status === OrderStatus.DELIVERED).map(i => ({ ...i, tableId: t.id, table: t })));

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ChefHat className="text-orange-500" /> Cozinha Digital</h2>
          <p className="text-xs text-slate-500 font-medium">Controle de produção (KDS)</p>
        </div>
        
        {/* Abas Responsivas */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('PREPARING')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PREPARING' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500'}`}>Preparo ({preparingItems.length})</button>
          <button onClick={() => setActiveTab('READY')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'READY' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>Prontos ({readyItems.length})</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}>Histórico</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'PREPARING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preparingItems.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 italic">Nenhum pedido em preparo</div>
            ) : (
              preparingItems.map((item, idx) => (
                <div key={idx} className="bg-white border-l-4 border-orange-500 rounded-2xl shadow-sm p-4 flex flex-col gap-3 animate-fade-in-up">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-sm">Mesa #{item.tableId}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> {item.status}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800">{item.quantity}x {item.productName}</h4>
                    {item.notes && <p className="text-xs text-rose-500 font-bold italic mt-1">Obs: {item.notes}</p>}
                  </div>
                  <button 
                    onClick={() => handleAdvanceStatus(item.table as Table, item.table.items.findIndex(i => i === item))}
                    className="w-full bg-orange-50 text-orange-600 py-3 rounded-xl font-black text-sm hover:bg-orange-100 flex items-center justify-center gap-2"
                  >
                    Marcar como Pronto <ChevronRight size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'READY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyItems.map((item, idx) => (
              <div key={idx} className="bg-white border-l-4 border-emerald-500 rounded-2xl shadow-sm p-4 flex flex-col gap-3 animate-fade-in-up">
                <div className="flex justify-between items-start">
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-black text-sm">Mesa #{item.tableId}</span>
                  <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full"><Bell size={16} className="animate-bounce" /></div>
                </div>
                <h4 className="text-lg font-black text-slate-800">{item.quantity}x {item.productName}</h4>
                <button 
                  onClick={() => handleAdvanceStatus(item.table as Table, item.table.items.findIndex(i => i === item))}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-emerald-100"
                >
                  Entregar Pedido
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                 <tr>
                   <th className="px-6 py-4">Mesa</th>
                   <th className="px-6 py-4">Item</th>
                   <th className="px-6 py-4 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {deliveredItems.slice(-20).map((item, idx) => (
                   <tr key={idx}>
                     <td className="px-6 py-4 font-bold text-sm">#{item.tableId}</td>
                     <td className="px-6 py-4 text-sm font-medium">{item.quantity}x {item.productName}</td>
                     <td className="px-6 py-4 text-right"><span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Entregue</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};
