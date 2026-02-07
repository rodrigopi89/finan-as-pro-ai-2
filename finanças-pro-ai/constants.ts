import { Transaction, Goal, Reminder } from './types';

export const CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Salário',
  'Investimentos',
  'Outros'
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-01', description: 'Salário Mensal', amount: 5000, type: 'income', category: 'Salário' },
  { id: '2', date: '2023-10-03', description: 'Aluguel', amount: 1500, type: 'expense', category: 'Moradia' },
  { id: '3', date: '2023-10-05', description: 'Supermercado', amount: 600, type: 'expense', category: 'Alimentação' },
  { id: '4', date: '2023-10-10', description: 'Gasolina', amount: 250, type: 'expense', category: 'Transporte' },
  { id: '5', date: '2023-10-12', description: 'Jantar Fora', amount: 150, type: 'expense', category: 'Lazer' },
  { id: '6', date: '2023-10-15', description: 'Freelance Projeto X', amount: 1200, type: 'income', category: 'Salário' },
];

export const MOCK_GOALS: Goal[] = [
  { id: '1', category: 'Alimentação', targetAmount: 1000, currentAmount: 600, color: '#F59E0B' },
  { id: '2', category: 'Lazer', targetAmount: 400, currentAmount: 150, color: '#EC4899' },
  { id: '3', category: 'Economia Mensal', targetAmount: 1500, currentAmount: 0, color: '#10B981' }, 
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: '1', title: 'Conta de Luz', amount: 120, dueDate: '2023-10-20', isPaid: false },
  { id: '2', title: 'Internet', amount: 100, dueDate: '2023-10-25', isPaid: false },
];