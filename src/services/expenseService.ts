import type { ExpenseItem } from "../types/expenseItem";

const STORAGE_KEY = "kaza_expenses";

export const buildExpenseReceiptImageName = (
  dateIncurred: string,
  originalName: string
) => {
  const ext = originalName.includes(".")
    ? `.${originalName.split(".").pop()}`
    : "";
  const safeExt = ext.toLowerCase().replace(/[^.a-z0-9]/g, "") || ".jpg";
  const datePart = dateIncurred || new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `expense-${datePart}-${stamp}${safeExt}`;
};

const readAll = (): ExpenseItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExpenseItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (items: ExpenseItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const ExpenseService = {
  getAll: (): ExpenseItem[] => readAll(),

  create: (data: Omit<ExpenseItem, "id">): ExpenseItem => {
    const current = readAll();
    const nextId = current.length > 0 ? Math.max(...current.map((x) => x.id)) + 1 : 1;
    const created: ExpenseItem = { id: nextId, ...data };
    const next = [created, ...current];
    writeAll(next);
    return created;
  },
};
