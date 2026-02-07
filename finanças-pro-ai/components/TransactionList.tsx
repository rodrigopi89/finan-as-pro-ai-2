import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction 
}) => {
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI State
  const [showRecent, setShowRecent] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory(CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const startEditing = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setDate(t.date);
    // Rola para o formulário no topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Histórico de adições recentes (baseado no ID timestamp para mostrar o que foi inserido por último, independente da data)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);
  }, [transactions]);

  // Filter Logic (Main List)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'Todas' || t.category === filterCategory;
      const matchType = filterType === 'all' || t.type === filterType;
      const matchStart = !filterStartDate || t.date >= filterStartDate;
      const matchEnd = !filterEndDate || t.date <= filterEndDate;
      return matchSearch && matchCategory && matchType && matchStart && matchEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterCategory, filterType, filterStartDate, filterEndDate]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        return [
          t.id,
          t.date,
          `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
          t.category,
          t.type === 'income' ? 'Receita' : 'Despesa',
          t.amount.toFixed(2)
        ].join(',')
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financas_transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    if (editingId) {
      onUpdateTransaction({
        id: editingId,
        description,
        amount: parseFloat(amount),
        type,
        category,
        date
      });
    } else {
      onAddTransaction({
        description,
        amount: parseFloat(amount),
        type,
        category,
        date
      });
      // Opcional: Abrir a lista de recentes ao adicionar
      setShowRecent(true);
    }

    resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingId ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Cancelar
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Ex: Supermercado"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors ${
                editingId 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {editingId ? 'Atualizar Transação' : (type === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa')}
            </button>
          </form>
        </div>
      </div>

      {/* List Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Seção de Recentes Adicionados (Collapsible) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors"
          >
             <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-sm md:text-base">Últimas 5 Adições</h3>
             </div>
             <div className="flex items-center gap-2 text-gray-400">
               <span className="text-xs font-medium">{showRecent ? 'Ocultar' : 'Mostrar'}</span>
               <svg className={`w-5 h-5 transition-transform duration-300 ${showRecent ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
          </button>
          
          {showRecent && (
            <div className="p-4 bg-white animate-fade-in border-t border-gray-100">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">Nenhuma transação registrada ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {recentTransactions.map(t => (
                     <div 
                        key={t.id} 
                        onClick={() => startEditing(t)}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                     >
                        <div>
                           <p className="font-medium text-sm text-gray-800 group-hover:text-indigo-700">{t.description}</p>
                           <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                        </div>
                        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                           {t.type === 'income' ? '+' : '-'} {t.amount.toFixed(2)}
                        </span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Historical List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Histórico Completo</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden sm:inline">{filteredTransactions.length} registros</span>
              <button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar dados filtrados para CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Descrição..."
                  className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Todas">Todas</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="all">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Valor</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Nenhuma transação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr 
                      key={t.id} 
                      onDoubleClick={() => startEditing(t)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${editingId === t.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                      title="Clique duas vezes para editar"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{t.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center items-center space-x-3">
                        <button
                          onClick={() => startEditing(t)}
                          className="text-indigo-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTransaction(t.id);
                          }}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};