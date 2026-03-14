import { useCallback, useEffect, useState } from "react";
import type { ExpenseItem, ExpenseItemInput } from "../types/expenseItem";
import { ExpenseService } from "../services/expenseService";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ExpenseService.getAll();
      setExpenses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load expenses";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (payload: ExpenseItemInput, files: File[] = []) => {
    setError(null);
    try {
      const created = await ExpenseService.create(payload, files);
      setExpenses((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create expense";
      setError(message);
      throw err;
    }
  }, []);

  const editExpense = useCallback(async (id: number, payload: Partial<ExpenseItemInput>) => {
    setError(null);
    try {
      const updated = await ExpenseService.update(id, payload);
      if (!updated) {
        setError("Expense not found");
        return null;
      }
      setExpenses((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update expense";
      setError(message);
      throw err;
    }
  }, []);

  const removeExpense = useCallback(async (id: number) => {
    setError(null);
    try {
      const deleted = await ExpenseService.delete(id);
      if (!deleted) {
        setError("Expense not found");
      } else {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      }
      return deleted;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete expense";
      setError(message);
      throw err;
    }
  }, []);

  const getExpenseById = useCallback(async (id: number): Promise<ExpenseItem | null> => {
    setError(null);
    try {
      const item = await ExpenseService.getById(id);
      if (!item) {
        setError("Expense not found");
        return null;
      }
      return item;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load expense";
      setError(message);
      return null;
    }
  }, []);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    refresh: fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
    getExpenseById,
  };
};
