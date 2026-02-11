export type SplitPaymentPart = {
  method: string;
  amount: number | "";
};

export type PaymentData = {
  isPaid: boolean;
  paymentMethod: string; // used when not split
  isSplit: boolean;
  parts: SplitPaymentPart[];
};