import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction, FinancialSummary, Reminder, Goal } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  summary: FinancialSummary;
  reminders: Reminder[];
  goals: Goal[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#EF4444', '#6366F1'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, summary, reminders, goals }) => {
  
  // --- Notification Logic ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });
  
  // Ref para rastrear notificações já enviadas nesta sessão para evitar spam
  const notifiedRef = useRef(new Set<string>());

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações de desktop.');
      return;
    }

    if (Notification.permission === 'granted') {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem('notifications_enabled', String(newState));
      if (newState) {
         new Notification('Notificações Ativadas', { body: 'O Finanças Pro avisará sobre seus limites.' });
      }
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        new Notification('Notificações Ativadas', { body: 'O Finanças Pro avisará sobre seus limites.' });
      }
    } else {
      alert('As notificações foram bloqueadas. Habilite-as nas configurações do navegador.');
    }
  };

  // --- Data Processing ---

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); 
  }, [transactions]);

  const totalExpensesForChart = useMemo(() => 
    expenseData.reduce((acc, item) => acc + item.value, 0)
  , [expenseData]);

  const monthlyFlowData = [
    { name: 'Entradas', valor: summary.totalIncome },
    { name: 'Saídas', valor: summary.totalExpense },
  ];

  const overdueReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reminders.filter(r => {
      if (r.isPaid) return false;
      const dueDate = new Date(r.dueDate + 'T00:00:00'); 
      return dueDate < today;
    });
  }, [reminders]);

  // Encontrar meta global independentemente de estar estourada ou não
  const globalGoal = useMemo(() => goals.find(g => g.category === 'ORÇAMENTO_TOTAL'), [goals]);

  const { overBudgetGlobal, overBudgetCategories } = useMemo(() => {
    const categories = goals.filter(g => g.category !== 'ORÇAMENTO_TOTAL' && g.currentAmount > g.targetAmount);
    return {
      overBudgetGlobal: globalGoal && globalGoal.currentAmount > globalGoal.targetAmount ? globalGoal : null,
      overBudgetCategories: categories
    };
  }, [goals, globalGoal]);


  // --- Watcher Effect for Notifications ---
  useEffect(() => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    // 1. Verificar Orçamento Global (Aviso de 90% ou Estouro)
    if (globalGoal && globalGoal.targetAmount > 0) {
      const percentage = (globalGoal.currentAmount / globalGoal.targetAmount) * 100;
      
      // Caso 1: Estourou 100%
      if (globalGoal.currentAmount > globalGoal.targetAmount) {
        const key = `global-exceeded-${new Date().getMonth()}`;
        if (!notifiedRef.current.has(key)) {
          new Notification('Orçamento Estourado! 🚨', {
            body: `Você excedeu seu orçamento mensal total de R$ ${globalGoal.targetAmount.toFixed(2)}.`,
            icon: '/icon.png' // Fallback icon default
          });
          notifiedRef.current.add(key);
        }
      } 
      // Caso 2: Perto do limite (90% a 99%)
      else if (percentage >= 90) {
        const key = `global-warning-${new Date().getMonth()}`;
        if (!notifiedRef.current.has(key)) {
           new Notification('Orçamento Comprometido ⚠️', {
            body: `Atenção! Você já usou ${percentage.toFixed(0)}% do seu orçamento mensal total.`,
          });
          notifiedRef.current.add(key);
        }
      }
    }

    // 2. Verificar Categorias Individuais
    overBudgetCategories.forEach(cat => {
       const key = `cat-exceeded-${cat.id}-${new Date().getMonth()}`;
       if (!notifiedRef.current.has(key)) {
         new Notification(`Limite Excedido: ${cat.category} 💸`, {
           body: `Você gastou R$ ${cat.currentAmount.toFixed(2)}, excedendo o limite de R$ ${cat.targetAmount.toFixed(2)}.`,
         });
         notifiedRef.current.add(key);
       }
    });

  }, [transactions, goals, notificationsEnabled, globalGoal, overBudgetCategories]);


  // --- Render Helpers ---

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, fill } = payload[0];
      const percent = totalExpensesForChart > 0 ? ((value / totalExpensesForChart) * 100).toFixed(1) : '0.0';
      const isOver = overBudgetCategories.some(c => c.category === name);
      
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fill }}></div>
            <p className="font-semibold text-gray-800">{name}</p>
            {isOver && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">ALERTA</span>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-600">R$ {Number(value).toFixed(2)}</span>
            <span className="text-sm font-bold text-gray-400">({percent}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Header com Toggle de Notificação */}
      <div className="flex justify-end">
        <button
          onClick={requestNotificationPermission}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            notificationsEnabled 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
          title={notificationsEnabled ? "Clique para desativar notificações" : "Clique para ativar avisos de orçamento"}
        >
          {notificationsEnabled ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Alertas Ativados</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </>
          ) : (
             <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span>Ativar Alertas</span>
            </>
          )}
        </button>
      </div>

      {/* Container de Alertas */}
      <div className="space-y-4">
        {/* Alerta de Contas Atrasadas */}
        {overdueReminders.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse-slow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Atenção: Você tem {overdueReminders.length} conta(s) em atraso!
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside">
                    {overdueReminders.map(r => (
                      <li key={r.id}>
                        {r.title} - R$ {r.amount.toFixed(2)} (Venceu em {new Date(r.dueDate).toLocaleDateString('pt-BR')})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Orçamento Global Estourado - Crítico */}
        {overBudgetGlobal && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl shadow-sm">
             <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">
                  CRÍTICO: Orçamento Mensal Total Excedido!
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  Você gastou <strong>R$ {overBudgetGlobal.currentAmount.toFixed(2)}</strong> de um limite de <strong>R$ {overBudgetGlobal.targetAmount.toFixed(2)}</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Limites por Categoria Excedidos */}
        {overBudgetCategories.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-sm font-medium text-orange-800 mb-2">
                  Limites por Categoria Excedidos ({overBudgetCategories.length})
                </h3>
                
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
                  {overBudgetCategories.map(g => {
                     const diff = g.currentAmount - g.targetAmount;
                     const percent = ((diff / g.targetAmount) * 100).toFixed(0);
                     return (
                      <div key={g.id} className="bg-white/80 p-3 rounded-md border border-orange-200 shadow-sm transition hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-orange-900 text-sm">{g.category}</span>
                           <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shadow-sm">
                             +{percent}%
                           </span>
                        </div>
                        <div className="text-xs text-orange-800 space-y-1">
                           <div className="flex justify-between">
                             <span className="opacity-70">Limite:</span>
                             <span>R$ {g.targetAmount.toFixed(0)}</span>
                           </div>
                           <div className="flex justify-between font-semibold">
                             <span className="opacity-70">Gasto:</span>
                             <span>R$ {g.currentAmount.toFixed(0)}</span>
                           </div>
                           <div className="pt-1 border-t border-orange-100 flex justify-between text-red-600 font-bold mt-1">
                             <span>Excesso:</span>
                             <span>R$ {diff.toFixed(2)}</span>
                           </div>
                        </div>
                      </div>
                     );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Receita Total</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            R$ {summary.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Despesas Totais</p>
          <p className="text-2xl font-bold text-red-500 mt-2">
            R$ {summary.totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Saldo Atual</p>
          <p className={`text-2xl font-bold mt-2 ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            R$ {summary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Bar dataKey="valor" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={50}>
                  {monthlyFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
          <div className="h-64">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => {
                      // Se a categoria estiver estourada, pinte de VERMELHO, senão use a cor padrão
                      const isOverLimit = overBudgetCategories.some(g => g.category === entry.name);
                      return <Cell key={`cell-${index}`} fill={isOverLimit ? '#EF4444' : COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Nenhuma despesa registrada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};