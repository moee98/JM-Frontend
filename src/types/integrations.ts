// ── Square ──────────────────────────────────────────────────────────────────

export interface SquareTransaction {
  id: string;
  amountMoney: number;    // in smallest currency unit (pence)
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

// ── eBay ────────────────────────────────────────────────────────────────────

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
