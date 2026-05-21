import api from "./apiService";
import type {
  IntegrationStatus,
  SquareSummary,
  SquareTransactionsResult,
  SquareDevicesResult,
  TerminalCheckoutRequest,
  TerminalCheckoutResult,
  TerminalCheckoutStatus,
  EbayOrdersResult,
  EbayListingsResult,
  EbaySummary,
} from "../types/integrations";

// ── Square ──────────────────────────────────────────────────────────────────

export const getSquareStatus = async (): Promise<IntegrationStatus> => {
  const res = await api.get<IntegrationStatus>("/integrations/square/status");
  return res.data;
};

export const getSquareTransactions = async (): Promise<SquareTransactionsResult> => {
  const res = await api.get<SquareTransactionsResult>("/integrations/square/transactions");
  return res.data;
};

export const getSquareSummary = async (): Promise<SquareSummary> => {
  const res = await api.get<SquareSummary>("/integrations/square/summary");
  return res.data;
};

export const connectSquare = (): void => {
  window.location.href = "/api/integrations/square/connect";
};

export const disconnectSquare = async (): Promise<void> => {
  await api.delete("/integrations/square/disconnect");
};

export const getSquareDevices = async (): Promise<SquareDevicesResult> => {
  const res = await api.get<SquareDevicesResult>("/integrations/square/devices");
  return res.data;
};

export const createTerminalCheckout = async (
  payload: TerminalCheckoutRequest
): Promise<TerminalCheckoutResult> => {
  const res = await api.post<TerminalCheckoutResult>(
    "/integrations/square/terminal/checkout",
    payload
  );
  return res.data;
};

export const getTerminalCheckoutStatus = async (
  checkoutId: string
): Promise<TerminalCheckoutStatus> => {
  const res = await api.get<TerminalCheckoutStatus>(
    `/integrations/square/terminal/checkout/${checkoutId}`
  );
  return res.data;
};

// ── eBay ────────────────────────────────────────────────────────────────────────

export const getEbayStatus = async (): Promise<IntegrationStatus> => {
  const res = await api.get<IntegrationStatus>("/integrations/ebay/status");
  return res.data;
};

export const getEbayOrders = async (): Promise<EbayOrdersResult> => {
  const res = await api.get<EbayOrdersResult>("/integrations/ebay/orders");
  return res.data;
};

export const getEbayListings = async (): Promise<EbayListingsResult> => {
  const res = await api.get<EbayListingsResult>("/integrations/ebay/listings");
  return res.data;
};

export const getEbaySummary = async (): Promise<EbaySummary> => {
  const res = await api.get<EbaySummary>("/integrations/ebay/summary");
  return res.data;
};

export const connectEbay = (): void => {
  window.location.href = "/api/integrations/ebay/connect";
};

export const disconnectEbay = async (): Promise<void> => {
  await api.delete("/integrations/ebay/disconnect");
};
