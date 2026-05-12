import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEbayStatus,
  getEbayOrders,
  getEbayListings,
  getEbaySummary,
  disconnectEbay,
} from "../services/integrationService";

export function useEbayStatus() {
  return useQuery({
    queryKey: ["ebay", "status"],
    queryFn: getEbayStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEbayOrders() {
  const { data: status } = useEbayStatus();
  return useQuery({
    queryKey: ["ebay", "orders"],
    queryFn: getEbayOrders,
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEbayListings() {
  const { data: status } = useEbayStatus();
  return useQuery({
    queryKey: ["ebay", "listings"],
    queryFn: getEbayListings,
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEbaySummary() {
  const { data: status } = useEbayStatus();
  return useQuery({
    queryKey: ["ebay", "summary"],
    queryFn: getEbaySummary,
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDisconnectEbay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectEbay,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ebay"] }),
  });
}
