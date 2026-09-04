import type { Debt, Expense, Product, Sale } from '@/types';

const today = new Date();
const date = (daysAgo: number) => {
  const value = new Date(today);
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
};

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Rice 5kg', sellingPrice: 8500, costPrice: 7600, quantity: 12, lowStockThreshold: 10, createdAt: date(20), updatedAt: date(1) },
  { id: 'p2', name: 'Peak Milk', sellingPrice: 1200, costPrice: 950, quantity: 28, lowStockThreshold: 8, createdAt: date(20), updatedAt: date(1) },
  { id: 'p3', name: 'Indomie Noodles', sellingPrice: 650, costPrice: 520, quantity: 7, lowStockThreshold: 10, createdAt: date(18), updatedAt: date(1) },
  { id: 'p4', name: 'Coca-Cola 50cl', sellingPrice: 500, costPrice: 380, quantity: 32, lowStockThreshold: 12, createdAt: date(16), updatedAt: date(1) },
  { id: 'p5', name: 'Bread', sellingPrice: 1200, costPrice: 950, quantity: 5, lowStockThreshold: 6, createdAt: date(15), updatedAt: date(1) },
  { id: 'p6', name: 'Phone Charger', sellingPrice: 6500, costPrice: 4800, quantity: 9, lowStockThreshold: 4, createdAt: date(12), updatedAt: date(1) },
  { id: 'p7', name: 'USB Cable', sellingPrice: 2500, costPrice: 1500, quantity: 18, lowStockThreshold: 5, createdAt: date(11), updatedAt: date(1) },
  { id: 'p8', name: 'Body Lotion', sellingPrice: 4500, costPrice: 3500, quantity: 3, lowStockThreshold: 5, createdAt: date(9), updatedAt: date(1) },
];

export const mockSales: Sale[] = [
  { id: 's1', items: [{ productId: 'p1', productName: 'Rice 5kg', quantity: 1, unitPrice: 8500, unitCost: 7600 }], total: 8500, profit: 900, createdAt: date(0) },
  { id: 's2', items: [{ productId: 'p6', productName: 'Phone Charger', quantity: 2, unitPrice: 6500, unitCost: 4800 }], total: 13000, profit: 3400, createdAt: date(0) },
  { id: 's3', items: [{ productId: 'p3', productName: 'Indomie Noodles', quantity: 5, unitPrice: 650, unitCost: 520 }], total: 3250, profit: 650, createdAt: date(1) },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', title: 'Delivery to customer', amount: 2500, category: 'Transport', createdAt: date(0) },
  { id: 'e2', title: 'Shop electricity', amount: 1800, category: 'Electricity', createdAt: date(1) },
  { id: 'e3', title: 'New display bags', amount: 3500, category: 'Supplies', createdAt: date(4) },
];

export const mockDebts: Debt[] = [
  { id: 'd1', customerName: 'Chinedu', amount: 12500, amountPaid: 0, description: 'Groceries', dueDate: date(-3), status: 'Outstanding', createdAt: date(2), updatedAt: date(2) },
  { id: 'd2', customerName: 'Amina', amount: 6800, amountPaid: 0, description: 'Cosmetics', dueDate: date(7), status: 'Outstanding', createdAt: date(5), updatedAt: date(5) },
  { id: 'd3', customerName: 'Tunde', amount: 4500, amountPaid: 4500, description: 'Household items', dueDate: date(1), status: 'Paid', createdAt: date(10), updatedAt: date(0) },
];