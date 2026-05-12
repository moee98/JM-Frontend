import api from "./apiService";
import type {
  IntegrationStatus,
  SquareSummary,
  SquareTransactionsResult,
  EbayOrdersResult,
  EbayListingsResult,
  EbaySummary,
} from "../types/integrations";

// ── Square ───────────────────────────────────────────────────────────────────

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

// ── eBay ─────────────────────────────────────────────────────────────────────

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
