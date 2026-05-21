// ── Square ─────────────────────────────────────────────────────────────────────────────

export interface SquareTransaction {
  id: string;
  amountMoney: number;
  currency: string;
  status: string;
  cardBrand?: string;
  last4?: string;
  createdAt: string;
}

export interface SquarePeriodSummary {
  amount: number;
  count: number;
}

export interface SquareSummary {
  today: SquarePeriodSummary;
  thisWeek: SquarePeriodSummary;
  thisMonth: SquarePeriodSummary;
}

export interface SquareTransactionsResult {
  transactions: SquareTransaction[];
}

export interface IntegrationStatus {
  connected: boolean;
  expiresAt?: string;
}

export interface SquareDevice {
  id: string;
  name: string;
  status: string;
}

export interface SquareDevicesResult {
  devices: SquareDevice[];
}

export interface TerminalCheckoutRequest {
  amountMoney: number;
  deviceId: string;
  jobId: number;
}

export interface TerminalCheckoutResult {
  checkoutId: string;
  status: string;
}

export interface TerminalCheckoutStatus {
  checkoutId: string;
  /** PENDING | IN_PROGRESS | COMPLETED | CANCELED | CANCEL_REQUESTED */
  status: string;
  squarePaymentId?: string;
}

// ── eBay ──────────────────────────────────────────────────────────────────────────

export interface EbayLineItem {
  title: string;
  quantity: number;
  price: number;
}

export interface EbayOrder {
  orderId: string;
  buyerUsername?: string;
  total: number;
  currency: string;
  status: string;
  shipmentComplete: boolean;
  createdAt: string;
  lineItems: EbayLineItem[];
}

export interface EbayListing {
  listingId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  status: string;
}

export interface EbayOrdersResult {
  orders: EbayOrder[];
}

export interface EbayListingsResult {
  listings: EbayListing[];
}

export interface EbaySummary {
  activeListings: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  pendingShipments: number;
}
