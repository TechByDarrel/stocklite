import { getDatabase } from './database';
import * as productRepo from './repositories/productRepository';
import * as saleRepo from './repositories/saleRepository';
import * as expenseRepo from './repositories/expenseRepository';
import * as debtRepo from './repositories/debtRepository';

const SEED_VERSION_KEY = 'db_seed_version';
const CURRENT_SEED_VERSION = '1.0.0';

export async function seedDatabaseIfNeeded(userId: string): Promise<void> {
  const db = await getDatabase();

  // Check if we've already seeded for this user
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      `SELECT name as key, value FROM sqlite_master WHERE type='table' LIMIT 1`
    );
    
    // Simple check: if products table exists and has data, assume seeded
    const products = await productRepo.getProducts();
    if (products.length > 0) {
      console.log('Database already seeded, skipping');
      return;
    }
  } catch (e) {
    // Table may not exist yet
  }

  console.log('Seeding database with initial data...');

  try {
    // Create initial products
    const today = new Date();
    const date = (daysAgo: number) => {
      const value = new Date(today);
      value.setDate(value.getDate() - daysAgo);
      return value.toISOString();
    };

    const productData = [
      { name: 'Rice 5kg', sellingPrice: 8500, costPrice: 7600, quantity: 12, lowStockThreshold: 10, date: date(20) },
      { name: 'Peak Milk', sellingPrice: 1200, costPrice: 950, quantity: 28, lowStockThreshold: 8, date: date(20) },
      { name: 'Indomie Noodles', sellingPrice: 650, costPrice: 520, quantity: 7, lowStockThreshold: 10, date: date(18) },
      { name: 'Coca-Cola 50cl', sellingPrice: 500, costPrice: 380, quantity: 32, lowStockThreshold: 12, date: date(16) },
      { name: 'Bread', sellingPrice: 1200, costPrice: 950, quantity: 5, lowStockThreshold: 6, date: date(15) },
      { name: 'Phone Charger', sellingPrice: 6500, costPrice: 4800, quantity: 9, lowStockThreshold: 4, date: date(12) },
      { name: 'USB Cable', sellingPrice: 2500, costPrice: 1500, quantity: 18, lowStockThreshold: 5, date: date(11) },
      { name: 'Body Lotion', sellingPrice: 4500, costPrice: 3500, quantity: 3, lowStockThreshold: 5, date: date(9) },
    ];

    for (const p of productData) {
      await productRepo.createProduct({
        name: p.name,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        quantity: p.quantity,
        lowStockThreshold: p.lowStockThreshold,
      });
    }

    // Create initial sales
    const products = await productRepo.getProducts();
    if (products.length > 0) {
      // Find specific products by name for sales
      const rice = products.find(p => p.name === 'Rice 5kg');
      const charger = products.find(p => p.name === 'Phone Charger');
      const noodles = products.find(p => p.name === 'Indomie Noodles');

      if (rice) {
        await saleRepo.createSale([
          {
            productId: rice.id,
            productName: rice.name,
            quantity: 1,
            unitPrice: rice.sellingPrice,
            unitCost: rice.costPrice,
          },
        ]);
      }

      if (charger) {
        await saleRepo.createSale([
          {
            productId: charger.id,
            productName: charger.name,
            quantity: 2,
            unitPrice: charger.sellingPrice,
            unitCost: charger.costPrice,
          },
        ]);
      }

      if (noodles) {
        await saleRepo.createSale([
          {
            productId: noodles.id,
            productName: noodles.name,
            quantity: 5,
            unitPrice: noodles.sellingPrice,
            unitCost: noodles.costPrice,
          },
        ]);
      }
    }

    // Create initial expenses
    await expenseRepo.createExpense({
      title: 'Delivery to customer',
      amount: 2500,
      category: 'Transport',
    });
    await expenseRepo.createExpense({
      title: 'Shop electricity',
      amount: 1800,
      category: 'Electricity',
    });
    await expenseRepo.createExpense({
      title: 'New display bags',
      amount: 3500,
      category: 'Supplies',
    });

    // Create initial debts
    await debtRepo.createDebt({
      customerName: 'Chinedu',
      amount: 12500,
      description: 'Groceries',
      dueDate: date(-3),
    });
    await debtRepo.createDebt({
      customerName: 'Amina',
      amount: 6800,
      description: 'Cosmetics',
      dueDate: date(7),
    });
    await debtRepo.createDebt({
      customerName: 'Tunde',
      amount: 4500,
      description: 'Household items',
      dueDate: date(1),
    });

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}
