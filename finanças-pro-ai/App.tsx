import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { Goals } from './components/Goals';
import { Reminders } from './components/Reminders';
import { AIInsights } from './components/AIInsights';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { Transaction, Goal, Reminder, View, FinancialSummary, User } from './types';
import { MOCK_TRANSACTIONS, MOCK_GOALS, MOCK_REMINDERS } from './constants';

// Interface para o estado global da aplicação
interface AppState {
  transactions: Transaction[];
  goals: Goal[];
  reminders: Reminder[];
}

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'reverse';
  showUndo?: boolean;
}

function App() {
  // Application State - View
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // --- User Management Logic ---
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('app_users');
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      // Migração: Garante que todos os usuários tenham username e password (para dados antigos)
      return parsedUsers.map((u: any) => ({
        ...u,
        username: u.username || u.name.toLowerCase().replace(/\s+/g, ''),
        password: u.password || '123'
      }));
    }
    // Criação do usuário padrão inicial se não existir nenhum
    const defaultUser: User = {
      id: 'default-user-1',
      name: 'Usuário Principal',
      username: 'admin',
      password: '123',
      role: 'Admin',
      avatarColor: 'bg-indigo-500',
      createdAt: new Date().toISOString()
    };
    return [defaultUser];
  });

  // Current User starts as null to force Login
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Salvar usuários sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  // Se quiséssemos persistência de sessão, checaríamos aqui.
  // Por enquanto, recarregar a página exige login novamente, o que é mais seguro.

  // Gerar chaves de armazenamento baseadas no usuário
  const getStorageKeys = useCallback((userId: string) => ({
    transactions: `user_${userId}_transactions`,
    goals: `user_${userId}_goals`,
    reminders: `user_${userId}_reminders`
  }), []);

  // --- Undo/Redo & Data Loading Logic ---
  
  const [history, setHistory] = useState<{
    past: AppState[];
    present: AppState;
    future: AppState[];
  }>({
    past: [],
    present: { transactions: [], goals: [], reminders: [] },
    future: []
  });

  // Toast System State
  const [toast, setToast] = useState<ToastState | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, showUndo: boolean = false, type: 'success' | 'info' | 'reverse' = 'success') => {
    setToast({ message, showUndo, type });
  };

  // Effect para carregar dados quando o usuário mudar
  useEffect(() => {
    if (!currentUser) return;

    const keys = getStorageKeys(currentUser.id);
    const savedTransactions = localStorage.getItem(keys.transactions);
    const savedGoals = localStorage.getItem(keys.goals);
    const savedReminders = localStorage.getItem(keys.reminders);

    let initialTransactions = [];
    let initialGoals = [];
    let initialReminders = [];

    // Lógica para carregar dados antigos se for o usuário padrão e não tiver dados novos
    if (!savedTransactions && currentUser.id === 'default-user-1') {
      const legacyTrans = localStorage.getItem('transactions');
      initialTransactions = legacyTrans ? JSON.parse(legacyTrans) : MOCK_TRANSACTIONS;
    } else {
      initialTransactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      if (!savedTransactions && users.length === 1 && currentUser.id === users[0].id) {
         initialTransactions = MOCK_TRANSACTIONS;
      }
    }

    if (!savedGoals && currentUser.id === 'default-user-1') {
       const legacyGoals = localStorage.getItem('goals');
       initialGoals = legacyGoals ? JSON.parse(legacyGoals) : MOCK_GOALS;
    } else {
       initialGoals = savedGoals ? JSON.parse(savedGoals) : [];
       if (!savedGoals && users.length === 1 && currentUser.id === users[0].id) {
          initialGoals = MOCK_GOALS;
       }
    }

    if (!savedReminders && currentUser.id === 'default-user-1') {
       const legacyReminders = localStorage.getItem('reminders');
       initialReminders = legacyReminders ? JSON.parse(legacyReminders) : MOCK_REMINDERS;
    } else {
       initialReminders = savedReminders ? JSON.parse(savedReminders) : [];
       if (!savedReminders && users.length === 1 && currentUser.id === users[0].id) {
          initialReminders = MOCK_REMINDERS;
       }
    }

    setHistory({
      past: [],
      present: {
        transactions: initialTransactions,
        goals: initialGoals,
        reminders: initialReminders
      },
      future: []
    });
    setToast(null);

  }, [currentUser, getStorageKeys, users]); 

  // Atalhos para acesso fácil aos dados atuais
  const { transactions, goals, reminders } = history.present;

  // Persistence Effects
  useEffect(() => {
    if (!currentUser) return;
    const keys = getStorageKeys(currentUser.id);
    if (history.present.transactions) localStorage.setItem(keys.transactions, JSON.stringify(history.present.transactions));
    if (history.present.goals) localStorage.setItem(keys.goals, JSON.stringify(history.present.goals));
    if (history.present.reminders) localStorage.setItem(keys.reminders, JSON.stringify(history.present.reminders));
  }, [history.present, currentUser, getStorageKeys]);

  // Função central para atualizar o estado e gerenciar o histórico
  const updateState = useCallback((newState: AppState) => {
    setHistory(curr => {
      const newPast = [...curr.past, curr.present];
      if (newPast.length > 20) newPast.shift();

      return {
        past: newPast,
        present: newState,
        future: [] 
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
    showToast("Ação desfeita", false, 'reverse');
  }, []);

  const redo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
    showToast("Ação refeita", false, 'info');
  }, []);

  const handleUndoClick = () => {
    undo();
    setToast(null); // Fecha o toast ao desfazer
  };

  // Atalhos de teclado para Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);


  // Derived State: Summary
  const summary: FinancialSummary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  // Derived State: Update Goals based on transactions
  const processedGoals = useMemo(() => {
    return goals.map(goal => {
      let spent = 0;
      
      if (goal.category === 'ORÇAMENTO_TOTAL') {
        spent = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);
      } else {
        spent = transactions
          .filter(t => t.type === 'expense' && t.category === goal.category)
          .reduce((acc, t) => acc + t.amount, 0);
      }
      
      return { ...goal, currentAmount: spent };
    });
  }, [goals, transactions]);

  // --- Handlers with Toast Triggers ---

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Date.now().toString() };
    updateState({
      ...history.present,
      transactions: [...transactions, newTransaction]
    });
    showToast('Transação adicionada', true);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    updateState({
      ...history.present,
      transactions: transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    });
    showToast('Transação atualizada', true);
  };

  const handleDeleteTransaction = (id: string) => {
    updateState({
      ...history.present,
      transactions: transactions.filter(t => t.id !== id)
    });
    showToast('Transação excluída', true);
  };

  const handleAddGoal = (g: Omit<Goal, 'id'>) => {
    if (g.category === 'ORÇAMENTO_TOTAL') {
       const exists = goals.find(goal => goal.category === 'ORÇAMENTO_TOTAL');
       if (exists) {
         handleUpdateGoal({ ...exists, targetAmount: g.targetAmount });
         return;
       }
    }
    const newGoal = { ...g, id: Date.now().toString() };
    updateState({
      ...history.present,
      goals: [...goals, newGoal]
    });
    showToast('Meta definida', true);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    updateState({
      ...history.present,
      goals: goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    });
    showToast('Meta atualizada', true);
  };

  const handleDeleteGoal = (id: string) => {
    updateState({
      ...history.present,
      goals: goals.filter(g => g.id !== id)
    });
    showToast('Meta removida', true);
  };

  const handleAddReminder = (r: Omit<Reminder, 'id'>) => {
    const newReminder = { ...r, id: Date.now().toString() };
    updateState({
      ...history.present,
      reminders: [...reminders, newReminder]
    });
    showToast('Lembrete criado', true);
  };

  const handleToggleReminderPaid = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    updateState({
      ...history.present,
      reminders: reminders.map(r => r.id === id ? { ...r, isPaid: !r.isPaid } : r)
    });
    showToast(reminder?.isPaid ? 'Marcado como pendente' : 'Marcado como pago', true);
  };

  const handleDeleteReminder = (id: string) => {
    updateState({
      ...history.present,
      reminders: reminders.filter(r => r.id !== id)
    });
    showToast('Lembrete excluído', true);
  };

  // --- User Management Handlers (No Undo for User Mgmt to avoid complexity) ---

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    showToast(`Usuário ${newUser.name} criado!`, false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast('Perfil atualizado', false);
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert("Você não pode excluir o último usuário.");
      return;
    }
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    
    const keys = getStorageKeys(id);
    localStorage.removeItem(keys.transactions);
    localStorage.removeItem(keys.goals);
    localStorage.removeItem(keys.reminders);

    if (currentUser?.id === id) {
      // Se excluir o próprio usuário, faz logout
      setCurrentUser(null);
    }
    showToast('Usuário excluído', false);
  };

  const handleSwitchUser = (id: string) => {
    // Em um sistema real, exigiria senha. Aqui, facilitamos a troca mas mantemos o fluxo.
    const targetUser = users.find(u => u.id === id);
    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentView(View.DASHBOARD);
      showToast(`Perfil alterado para ${targetUser.name}`, false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Limpar o histórico ao sair
    setHistory({
      past: [],
      present: { transactions: [], goals: [], reminders: [] },
      future: []
    });
  };

  // --- UI Components ---

  const NavItem = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-indigo-50 text-indigo-600 font-semibold' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const BottomNavItem = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
        currentView === view 
          ? 'text-indigo-600' 
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );

  const UndoRedoControls = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button 
        onClick={undo} 
        disabled={history.past.length === 0}
        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Desfazer (Ctrl+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
        </svg>
      </button>
      <button 
        onClick={redo} 
        disabled={history.future.length === 0}
        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Refazer (Ctrl+Shift+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l6 7.7" />
        </svg>
      </button>
    </div>
  );

  const ToastNotification = () => {
    if (!toast) return null;

    return (
      <div className="fixed bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
        <div className="bg-gray-800 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-4 min-w-[300px] justify-between border border-gray-700">
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <span className="text-green-400">✓</span>}
            {toast.type === 'reverse' && <span className="text-yellow-400">↩</span>}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
          {toast.showUndo && (
            <button 
              onClick={handleUndoClick}
              className="text-yellow-400 hover:text-yellow-300 text-sm font-bold uppercase tracking-wide hover:underline"
            >
              Desfazer
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full fixed left-0 top-0 overflow-y-auto z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-indigo-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-bold">Finanças Pro</span>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-100">
           <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${currentUser.avatarColor}`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                 <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
              </div>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            view={View.DASHBOARD} 
            label="Dashboard" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          />
          <NavItem 
            view={View.TRANSACTIONS} 
            label="Transações" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          />
          <NavItem 
            view={View.GOALS} 
            label="Metas" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <NavItem 
            view={View.REMINDERS} 
            label="Lembretes" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          />
          <NavItem 
            view={View.AI_INSIGHTS} 
            label="AI Insights" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <NavItem 
            view={View.SETTINGS} 
            label="Usuários" 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             <span>Sair da Conta</span>
           </button>
           
           <div className="flex justify-between items-center mt-3 px-2">
             <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</span>
           </div>
           <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex justify-center">
             <UndoRedoControls />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-lg">Finanças Pro</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentView(View.SETTINGS)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.avatarColor}`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
              title="Sair"
            >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentView === View.DASHBOARD && 'Visão Geral'}
                {currentView === View.TRANSACTIONS && 'Minhas Transações'}
                {currentView === View.GOALS && 'Metas e Limites'}
                {currentView === View.REMINDERS && 'Contas e Lembretes'}
                {currentView === View.AI_INSIGHTS && 'Inteligência Financeira'}
                {currentView === View.SETTINGS && 'Configurações de Usuários'}
              </h1>
              <p className="text-gray-500 mt-1">
                {currentView === View.SETTINGS 
                  ? 'Gerencie quem usa o aplicativo.' 
                  : `Olá, ${currentUser.name.split(' ')[0]}! Gerencie suas finanças de forma inteligente.`}
              </p>
            </div>
            
            {/* Context Stats (Optional enhancement) */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
               <span>Histórico: {history.past.length} ações</span>
            </div>
          </header>

          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && (
              <Dashboard 
                transactions={transactions} 
                summary={summary} 
                reminders={reminders}
                goals={processedGoals}
              />
            )}
            {currentView === View.TRANSACTIONS && (
              <TransactionList 
                transactions={transactions} 
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}
            {currentView === View.GOALS && (
              <Goals 
                goals={processedGoals} 
                onAddGoal={handleAddGoal} 
                onDeleteGoal={handleDeleteGoal}
                onUpdateGoal={handleUpdateGoal}
              />
            )}
            {currentView === View.REMINDERS && (
              <Reminders 
                reminders={reminders} 
                onAddReminder={handleAddReminder}
                onTogglePaid={handleToggleReminderPaid}
                onDeleteReminder={handleDeleteReminder}
              />
            )}
            {currentView === View.AI_INSIGHTS && (
              <AIInsights transactions={transactions} goals={processedGoals} />
            )}
            {currentView === View.SETTINGS && (
              <UserManagement 
                users={users}
                currentUser={currentUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onSwitchUser={handleSwitchUser}
              />
            )}
          </div>
        </main>

        <ToastNotification />

        {/* Bottom Navigation - Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-1 py-1 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <BottomNavItem 
            view={View.DASHBOARD} 
            label="Início" 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          />
          <BottomNavItem 
            view={View.TRANSACTIONS} 
            label="Transações" 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          />
          <BottomNavItem 
            view={View.GOALS} 
            label="Metas" 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <BottomNavItem 
            view={View.REMINDERS} 
            label="Lembretes" 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          />
           <BottomNavItem 
            view={View.SETTINGS} 
            label="Usuários" 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
}

export default App;