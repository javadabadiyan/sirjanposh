
export interface Product {
  id: string;
  code: string;
  name: string;
  buyPrice: number;
  shippingCost: number;
  marginPercent: number;
  sellPrice: number;
  quantity: number;
  date: string;
}

export interface Partner {
  id: string;
  name: string;
  investment: number;
  date: string;
}

export interface PaymentHistory {
  id: string;
  partnerId: string;
  amount: number;
  period: string;
  date: string;
  description: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  date: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  permissions: string[]; // List of tab IDs the user can access
}

export interface AppData {
  products: Product[];
  partners: Partner[];
  payments: PaymentHistory[];
  invoices: Invoice[];
  users: User[];
}
