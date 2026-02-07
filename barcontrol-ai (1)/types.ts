
export enum ProductCategory {
  DRINK = 'Bebidas',
  SNACK = 'Lanches',
  PORTION = 'Porções',
  DESSERT = 'Sobremesas',
  OTHER = 'Outros'
}

export enum OrderStatus {
  PENDING = 'Pendente',
  PREPARING = 'Preparando',
  READY = 'Pronto',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado'
}

export enum TableStatus {
  FREE = 'Livre',
  OCCUPIED = 'Ocupada',
  RESERVED = 'Reservada',
  CLOSING = 'Fechando'
}

export enum UserRole {
  ADMIN = 'Administrador',
  WAITER = 'Garçom',
  COOK = 'Cozinheiro',
  BARTENDER = 'Bartender'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  allowedViews: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  notes?: string;
}

export interface Table {
  id: number;
  status: TableStatus;
  items: OrderItem[];
  openedAt?: number;
  customerName?: string;
  x?: number;
  y?: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  total: number;
  items: OrderItem[];
  paymentMethod: string;
  sellerId: string;   // Novo campo
  sellerName: string; // Novo campo
}
