import { useCallback, useEffect, useState } from "react";
import type { ExpenseItem } from "../types/expenseItem";
import { ExpenseService } from "../services/expenseService";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = ExpenseService.getAll();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback((payload: Omit<ExpenseItem, "id">) => {
    const created = ExpenseService.create(payload);
    setExpenses((prev) => [created, ...prev]);
    return created;
  }, []);

  return { expenses, loading, refresh, addExpense };
};

