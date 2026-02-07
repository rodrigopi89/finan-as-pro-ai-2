import { Product, Table, Sale, ProductCategory, TableStatus, OrderStatus, User, UserRole } from '../types';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'X-Bacon Artesanal', description: 'Hambúrguer 180g, bacon crocante, queijo cheddar.', price: 28.50, category: ProductCategory.SNACK, stock: 50 },
  { id: '2', name: 'Batata Frita com Cheddar', description: 'Porção generosa de 400g.', price: 22.00, category: ProductCategory.PORTION, stock: 30 },
  { id: '3', name: 'Cerveja IPA Local', description: 'Garrafa 600ml.', price: 18.00, category: ProductCategory.DRINK, stock: 100 },
  { id: '4', name: 'Refrigerante Lata', description: '350ml Variados.', price: 6.00, category: ProductCategory.DRINK, stock: 200 },
  { id: '5', name: 'Caipirinha de Limão', description: 'Cachaça artesanal.', price: 15.00, category: ProductCategory.DRINK, stock: 40 },
  { id: '6', name: 'Pudim de Leite', description: 'Fatia individual.', price: 8.00, category: ProductCategory.DESSERT, stock: 15 },
];

// Generate tables with grid-like coordinates initially
const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: TableStatus.FREE,
  items: [],
  x: (i % 4) * 220 + 20, // Initial X position
  y: Math.floor(i / 4) * 150 + 20 // Initial Y position
}));

// Usuário padrão Admin
const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    name: 'Administrador',
    username: 'admin',
    password: '123',
    role: UserRole.ADMIN,
    allowedViews: ['dashboard', 'pos', 'kitchen', 'inventory', 'kiosk', 'users']
  }
];

const STORAGE_KEYS = {
  PRODUCTS: 'bar_products',
  TABLES: 'bar_tables',
  SALES: 'bar_sales',
  USERS: 'bar_users',
  SESSION: 'bar_session'
};

export const StoreService = {
  // --- Products ---
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  },

  saveProduct: (product: Product) => {
    const products = StoreService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return products;
  },

  // --- Tables ---
  getTables: (): Table[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TABLES);
    return stored ? JSON.parse(stored) : INITIAL_TABLES;
  },

  updateTable: (table: Table) => {
    const tables = StoreService.getTables();
    const index = tables.findIndex(t => t.id === table.id);
    if (index >= 0) {
      tables[index] = table;
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    }
  },

  // --- Sales ---
  getSales: (): Sale[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  },

  addSale: (sale: Sale) => {
    const sales = StoreService.getSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  // --- Users & Auth ---
  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  },

  saveUser: (user: User) => {
    const users = StoreService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    // Check for duplicate username only if creating new
    if (index === -1) {
        const exists = users.some(u => u.username === user.username);
        if (exists) throw new Error("Nome de usuário já existe.");
        users.push(user);
    } else {
        users[index] = user;
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return users;
  },

  deleteUser: (userId: string) => {
    const users = StoreService.getUsers();
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === UserRole.ADMIN) {
        const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
        if (adminCount <= 1) throw new Error("Não é possível remover o único administrador.");
    }

    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    return filtered;
  },

  validateLogin: (username: string, password: string): User | null => {
    const users = StoreService.getUsers();
    return users.find(u => u.username === username && u.password === password) || null;
  },

  // --- System ---
  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};