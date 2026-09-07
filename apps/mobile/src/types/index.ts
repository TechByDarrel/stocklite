export type ExpenseCategory = 'Transport' | 'Electricity' | 'Diesel' | 'Rent' | 'Staff wages' | 'Stock purchase' | 'Data/Airtime' | 'Repairs' | 'Supplies' | 'Other';
export type DebtStatus = 'Outstanding' | 'Paid';

export interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  profit: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  customerName: string;
  amount: number;
  amountPaid: number;
  description: string;
  dueDate: string;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  productCount: number;
  lowStockCount: number;
  outstandingDebts: number;
}