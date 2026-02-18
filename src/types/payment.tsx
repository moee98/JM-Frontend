export type SplitPaymentPart = {
  method: string;
  amount: number | "";
};
export type PaymentMethodType = "" | "cash" | "card" | "bank-transfer" | "online" | "split";
export type PaymentData = {
  isPaid: boolean;
  paymentMethod: string; // used when not split
  isSplit: boolean;
  parts: SplitPaymentPart[];
};

export type PaymentMethod = {
  isPaid: boolean;
  MethodName: Exclude<PaymentMethodType, "" | "split">;
  amount: number;
  jobId: number;
  createdAt: string;
  updatedAt: string;
};
