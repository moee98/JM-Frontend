export interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  dateIncurred: string; // ISO date string
  category: string;
  receiptImagePath: string;
  isReimbursed: boolean;
  paymentMethod: string;
}
