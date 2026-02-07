import React, { useState } from 'react';
import { Reminder } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  onAddReminder: (r: Omit<Reminder, 'id'>) => void;
  onTogglePaid: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const Reminders: React.FC<RemindersProps> = ({ 
  reminders, 
  onAddReminder, 
  onTogglePaid,
  onDeleteReminder 
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    onAddReminder({
      title,
      amount: parseFloat(amount),
      dueDate,
      isPaid: false
    });

    setTitle('');
    setAmount('');
    setDueDate('');
  };

  const sortedReminders = [...reminders].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Data atual para comparação (normalizada para início do dia)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Novo Lembrete</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta / Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Internet"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors"
            >
              Adicionar Lembrete
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {sortedReminders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl">
            Nenhum lembrete pendente.
          </div>
        ) : (
          sortedReminders.map(rem => {
            // Comparação simples de data considerando que dueDate é YYYY-MM-DD
            const dueObj = new Date(rem.dueDate + 'T00:00:00');
            const isLate = dueObj < today && !rem.isPaid;
            
            return (
              <div 
                key={rem.id} 
                className={`flex items-center justify-between p-4 rounded-xl shadow-sm border border-l-4 transition-all ${
                  rem.isPaid 
                    ? 'bg-white border-gray-100 border-l-green-500 opacity-60' 
                    : isLate 
                      ? 'bg-red-50 border-red-100 border-l-red-500' 
                      : 'bg-white border-gray-100 border-l-yellow-400'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onTogglePaid(rem.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      rem.isPaid ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500 bg-white'
                    }`}
                  >
                    {rem.isPaid && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  
                  <div>
                    <h4 className={`font-medium flex items-center gap-2 ${rem.isPaid ? 'text-gray-500 line-through' : isLate ? 'text-red-700' : 'text-gray-800'}`}>
                      {rem.title}
                      {isLate && (
                        <span title="Conta em atraso" className="flex items-center justify-center w-5 h-5 bg-red-100 rounded-full text-red-600">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                      )}
                    </h4>
                    <p className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      Vence em: {new Date(rem.dueDate).toLocaleDateString('pt-BR')} 
                      {isLate && <span className="text-red-700 font-bold ml-2">(ATRASADO)</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`font-bold ${rem.isPaid ? 'text-gray-400' : isLate ? 'text-red-700' : 'text-gray-800'}`}>
                    R$ {rem.amount.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => onDeleteReminder(rem.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};