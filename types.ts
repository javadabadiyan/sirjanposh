
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
  registeredBy: string;
}

export interface InvestmentRecord {
  id: string;
  amount: number;
  date: string;
  registeredBy: string;
}

export interface Partner {
  id: string;
  name: string;
  investments: InvestmentRecord[];
  date: string;
  registeredBy: string;
}

export interface PaymentHistory {
  id: string;
  partnerId: string;
  amount: number;
  period: string;
  date: string;
  description: string;
  registeredBy: string;
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
  customerAddress: string;
  customerPhone: string;
  items: InvoiceItem[];
  totalAmount: number;
  date: string;
  registeredBy: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  permissions: string[];
  registeredBy?: string;
}

export interface AppData {
  products: Product[];
  partners: Partner[];
  payments: PaymentHistory[];
  invoices: Invoice[];
  users: User[];
}
