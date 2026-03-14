import type { AttachmentSummary } from "./attachment";

export interface ExpenseItemInput {
  description: string;
  amount: number;
  dateIncurred: string;
  expenseCategoryId: number;
  isReimbursed: boolean;
  paymentMethod: string;
  receiptImagePath?: string | null;
}

export interface ExpenseItem extends ExpenseItemInput {
  id: number;
  category: string;
  attachments: AttachmentSummary[];
}
