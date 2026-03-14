import type { AttachmentSummary } from "../types/attachment";
import type { ExpenseItem, ExpenseItemInput } from "../types/expenseItem";
import type { ExpenseItemCategory } from "../types/expenseItemCategory";
import api from "./apiService";

const ENDPOINT = "/ExpenseItems";
const CATEGORY_ENDPOINT = "/ExpenseItems/category";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeCategoryItem = (
  value: unknown,
  fallbackId: number
): ExpenseItemCategory | null => {
  if (!isRecord(value)) return null;

  const rawId = Number(value.id);
  const id = Number.isFinite(rawId) && rawId > 0 ? rawId : fallbackId;

  if (typeof value.name === "string" && value.name.trim()) {
    return {
      id,
      name: value.name.trim(),
    };
  }

  return null;
};

const normalizeAttachment = (value: unknown): AttachmentSummary | null => {
  if (!isRecord(value)) return null;

  const parsedId = Number(value.id);
  const fileSize = Number(value.fileSize);

  if (!Number.isFinite(parsedId) || parsedId <= 0) return null;

  return {
    id: parsedId,
    fileName: typeof value.fileName === "string" ? value.fileName : "Attachment",
    contentType:
      typeof value.contentType === "string"
        ? value.contentType
        : "application/octet-stream",
    fileSize: Number.isFinite(fileSize) ? fileSize : 0,
    uploadedAt:
      typeof value.uploadedAt === "string" && value.uploadedAt
        ? value.uploadedAt
        : new Date().toISOString(),
    downloadUrl: typeof value.downloadUrl === "string" ? value.downloadUrl : "",
  };
};

const normalizeExpense = (
  value: unknown,
  categoryLookup: Map<number, string>
): ExpenseItem | null => {
  if (!isRecord(value)) return null;

  const parsedId = Number(value.id);
  const parsedAmount = Number(value.amount);
  const parsedCategoryId = Number(value.expenseCategoryId ?? value.categoryId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) return null;

  const expenseCategoryId =
    Number.isFinite(parsedCategoryId) && parsedCategoryId > 0 ? parsedCategoryId : 0;

  return {
    id: parsedId,
    description: typeof value.description === "string" ? value.description : "",
    amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    dateIncurred:
      typeof value.dateIncurred === "string" && value.dateIncurred
        ? value.dateIncurred
        : new Date().toISOString(),
    expenseCategoryId,
    category: categoryLookup.get(expenseCategoryId) ?? `Category #${expenseCategoryId}`,
    receiptImagePath:
      typeof value.receiptImagePath === "string" ? value.receiptImagePath : null,
    isReimbursed: Boolean(value.isReimbursed),
    paymentMethod: typeof value.paymentMethod === "string" ? value.paymentMethod : "",
    attachments: Array.isArray(value.attachments)
      ? value.attachments
          .map((attachment) => normalizeAttachment(attachment))
          .filter((attachment): attachment is AttachmentSummary => attachment !== null)
      : [],
  };
};

const getCategoryLookup = async () => {
  try {
    const categories = await ExpenseService.getAllCategories();
    return new Map(categories.map((category) => [category.id, category.name]));
  } catch {
    return new Map<number, string>();
  }
};

export const ExpenseService = {
  getAllCategories: async (): Promise<ExpenseItemCategory[]> => {
    const res = await api.get<unknown[]>(CATEGORY_ENDPOINT);
    if (!Array.isArray(res.data)) return [];

    const mapped = res.data
      .map((item, index) => normalizeCategoryItem(item, index + 1))
      .filter((item): item is ExpenseItemCategory => item !== null);

    const uniqueById = Array.from(
      new Map(mapped.map((category) => [category.id, category])).values()
    );

    return uniqueById.sort((a, b) => a.name.localeCompare(b.name));
  },

  getAll: async (): Promise<ExpenseItem[]> => {
    const [categoryLookup, res] = await Promise.all([
      getCategoryLookup(),
      api.get<unknown[]>(ENDPOINT),
    ]);

    if (!Array.isArray(res.data)) return [];

    return res.data
      .map((item) => normalizeExpense(item, categoryLookup))
      .filter((item): item is ExpenseItem => item !== null);
  },

  getById: async (id: number): Promise<ExpenseItem | null> => {
    const [categoryLookup, res] = await Promise.all([
      getCategoryLookup(),
      api.get<unknown>(`${ENDPOINT}/${id}`),
    ]);

    return normalizeExpense(res.data, categoryLookup);
  },

  uploadAttachments: async (
    id: number,
    files: File[]
  ): Promise<AttachmentSummary[]> => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("Files", file, file.name);
    });

    const res = await api.post<unknown[]>(`${ENDPOINT}/${id}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!Array.isArray(res.data)) return [];

    return res.data
      .map((attachment) => normalizeAttachment(attachment))
      .filter((attachment): attachment is AttachmentSummary => attachment !== null);
  },

  create: async (data: ExpenseItemInput, files: File[] = []): Promise<ExpenseItem> => {
    const res = await api.post<unknown>(ENDPOINT, data);
    const categoryLookup = await getCategoryLookup();
    const created = normalizeExpense(res.data, categoryLookup);

    if (!created) {
      throw new Error("Failed to parse created expense item.");
    }

    if (files.length > 0) {
      await ExpenseService.uploadAttachments(created.id, files);
      const refreshed = await ExpenseService.getById(created.id);
      if (refreshed) return refreshed;
    }

    return created;
  },

  update: async (
    id: number,
    data: Partial<ExpenseItemInput>
  ): Promise<ExpenseItem | null> => {
    const current = await ExpenseService.getById(id);
    if (!current) return null;

    await api.put<void>(`${ENDPOINT}/${id}`, {
      id,
      description: data.description ?? current.description,
      amount: data.amount ?? current.amount,
      dateIncurred: data.dateIncurred ?? current.dateIncurred,
      expenseCategoryId: data.expenseCategoryId ?? current.expenseCategoryId,
      receiptImagePath:
        data.receiptImagePath !== undefined
          ? data.receiptImagePath
          : current.receiptImagePath ?? null,
      isReimbursed: data.isReimbursed ?? current.isReimbursed,
      paymentMethod: data.paymentMethod ?? current.paymentMethod,
    });

    return ExpenseService.getById(id);
  },

  delete: async (id: number): Promise<boolean> => {
    await api.delete<void>(`${ENDPOINT}/${id}`);
    return true;
  },
};
