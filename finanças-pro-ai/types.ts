export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface Goal {
  id: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
  iconUrl?: string; // URL da imagem gerada pela IA
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface User {
  id: string;
  name: string;
  username: string; // Login
  password: string; // Senha
  role: string; // Ex: 'Admin', 'Membro'
  avatarColor: string;
  createdAt: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  GOALS = 'GOALS',
  REMINDERS = 'REMINDERS',
  AI_INSIGHTS = 'AI_INSIGHTS',
  SETTINGS = 'SETTINGS'
}