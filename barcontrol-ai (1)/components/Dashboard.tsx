
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale, Product, User } from '../types';
import { GeminiService } from '../services/geminiService';
import { StoreService } from '../services/store';
import { DollarSign, TrendingUp, AlertTriangle, Sparkles, Loader2, Filter, ReceiptText, ChevronDown, Calendar } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

type PeriodFilter = 'TODAY' | '2DAYS' | '15DAYS' | '30DAYS' | 'ALL';

export const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY'>('OVERVIEW');
  
  const [period, setPeriod] = useState<PeriodFilter>('TODAY');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('ALL');

  const users = useMemo(() => StoreService.getUsers(), []);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSeller = selectedSellerId === 'ALL' || sale.sellerId === selectedSellerId;
      if (!matchesSeller) return false;

      const now = Date.now();
      const diffMs = now - sale.timestamp;
      const oneDayMs = 24 * 60 * 60 * 1000;

      switch (period) {
        case 'TODAY':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return sale.timestamp >= today.getTime();
        case '2DAYS': return diffMs <= (2 * oneDayMs);
        case '15DAYS': return diffMs <= (15 * oneDayMs);
        case '30DAYS': return diffMs <= (30 * oneDayMs);
        default: return true;
      }
    });
  }, [sales, period, selectedSellerId]);

  const totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;
  
  const chartData = useMemo(() => {
    return filteredSales.slice(-10).map(sale => ({
      name: new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      valor: sale.total,
    }));
  }, [filteredSales]);

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const results = await GeminiService.analyzeBusiness(filteredSales, products);
    setInsights(Array.isArray(results) ? results : [String(results)]);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0 animate-fade-in">
      {/* Header Responsivo */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Painel Gerencial</h2>
            <p className="text-sm text-slate-500">Desempenho em tempo real.</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Resumo
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Vendas
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros - Scrollable no Mobile */}
        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            <div className="flex items-center gap-2 px-2 border-r border-slate-100 pr-4">
               <Filter size={16} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase">Filtros</span>
            </div>

            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAY">Hoje</option>
              <option value="2DAYS">2 Dias</option>
              <option value="15DAYS">15 Dias</option>
              <option value="30DAYS">30 Dias</option>
              <option value="ALL">Tudo</option>
            </select>

            <select 
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Vendedores (Todos)</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'OVERVIEW' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* KPI Grid */}
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Faturamento</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Transações</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{filteredSales.length}</h3>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={24} /></div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Baixo Estoque</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{lowStockCount}</h3>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="md:col-span-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Vendas Recentes
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="md:col-span-4 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold">IA Consultora</h3>
              </div>
              <button 
                onClick={handleGenerateInsights}
                disabled={loadingAi}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                {loadingAi ? <Loader2 className="animate-spin w-5 h-5" /> : <TrendingUp size={20} />}
              </button>
            </div>
            <div className="space-y-4">
              {insights.length > 0 ? (
                insights.map((text, i) => (
                  <div key={i} className="bg-white/10 p-3 rounded-xl text-xs leading-relaxed border border-white/10 animate-fade-in-up">
                    {text}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-60">
                  <p className="text-sm italic">Clique para gerar insights baseados nos filtros atuais.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vendas View - Responsiva */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ReceiptText size={18} /> Histórico Detalhado
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-black uppercase">Faturamento Filtrado:</span>
              <div className="text-lg font-black text-blue-600">R$ {totalRevenue.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Nenhuma venda encontrada.</td></tr>
                ) : (
                  [...filteredSales].reverse().map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700">{new Date(sale.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{sale.sellerName}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] px-2 py-1 bg-slate-100 rounded-full font-bold uppercase">{sale.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">R$ {sale.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
