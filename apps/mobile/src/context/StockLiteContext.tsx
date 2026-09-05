import { createContext, useContext, useState, useEffect, type PropsWithChildren } from 'react';
import type { Debt, Expense, Product, Sale, SaleItem } from '@/types';
import { initializeDatabase, setActiveUser } from '@/db/database';
import * as productRepo from '@/db/repositories/productRepository';
import * as saleRepo from '@/db/repositories/saleRepository';
import * as expenseRepo from '@/db/repositories/expenseRepository';
import * as debtRepo from '@/db/repositories/debtRepository';
import { useAuth } from '@/context/AuthContext';

interface StockLiteContextValue {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  recordSale: (items: SaleItem[]) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'amountPaid'>) => Promise<void>;
  markDebtPaid: (id: string) => Promise<void>;
}

const StockLiteContext = createContext<StockLiteContextValue | null>(null);

export function StockLiteProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and load data
  useEffect(() => {
    let cancelled = false;
    if (isAuthLoading || !user) {
      setActiveUser('anonymous');
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setDebts([]);
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Initialize database
        await initializeDatabase();
        setActiveUser(user.id);

        // Load all data from repositories
        const [loadedProducts, loadedSales, loadedExpenses, loadedDebts] = await Promise.all([
          productRepo.getProducts(),
          saleRepo.getSales(),
          expenseRepo.getExpenses(),
          debtRepo.getDebts(),
        ]);

        if (!cancelled) {
          setProducts(loadedProducts);
          setSales(loadedSales);
          setExpenses(loadedExpenses);
          setDebts(loadedDebts);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [isAuthLoading, user?.id]);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = await productRepo.createProduct(product);
      setProducts((current) => [newProduct, ...current]);
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updated = await productRepo.updateProduct(id, updates);
      if (updated) {
        setProducts((current) => current.map((p) => (p.id === id ? updated : p)));
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const success = await productRepo.deleteProduct(id);
      if (success) {
        setProducts((current) => current.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const recordSale = async (items: SaleItem[]) => {
    try {
      const newSale = await saleRepo.createSale(items);
      setSales((current) => [newSale, ...current]);

      // Refresh products to reflect new quantities
      const updatedProducts = await productRepo.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Failed to record sale:', error);
      throw error;
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const newExpense = await expenseRepo.createExpense(expense);
      setExpenses((current) => [newExpense, ...current]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      throw error;
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'amountPaid'>) => {
    try {
      const newDebt = await debtRepo.createDebt(debt);
      setDebts((current) => [newDebt, ...current]);
    } catch (error) {
      console.error('Failed to add debt:', error);
      throw error;
    }
  };

  const markDebtPaid = async (id: string) => {
    try {
      const updatedDebt = await debtRepo.markDebtPaid(id);
      if (updatedDebt) {
        setDebts((current) =>
          current.map((debt) => (debt.id === id ? updatedDebt : debt))
        );
      }
    } catch (error) {
      console.error('Failed to mark debt paid:', error);
      throw error;
    }
  };

  return (
    <StockLiteContext.Provider
      value={{
        products,
        sales,
        expenses,
        debts,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        recordSale,
        addExpense,
        addDebt,
        markDebtPaid,
      }}
    >
      {children}
    </StockLiteContext.Provider>
  );
}

export function useStockLite() {
  const context = useContext(StockLiteContext);
  if (!context) throw new Error('useStockLite must be used inside StockLiteProvider');
  return context;
}