import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSquareStatus,
  getSquareTransactions,
  getSquareSummary,
  disconnectSquare,
  getSquareDevices,
  createTerminalCheckout,
  getTerminalCheckoutStatus,
} from "../services/integrationService";
import type { TerminalCheckoutRequest } from "../types/integrations";

export function useSquareStatus() {
  return useQuery({
    queryKey: ["square", "status"],
    queryFn: getSquareStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSquareTransactions() {
  const { data: status } = useSquareStatus();
  return useQuery({
    queryKey: ["square", "transactions"],
    queryFn: getSquareTransactions,
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSquareSummary() {
  const { data: status } = useSquareStatus();
  return useQuery({
    queryKey: ["square", "summary"],
    queryFn: getSquareSummary,
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDisconnectSquare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectSquare,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["square"] }),
  });
}

export function useSquareDevices(enabled: boolean) {
  return useQuery({
    queryKey: ["square", "devices"],
    queryFn: getSquareDevices,
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useCreateTerminalCheckout() {
  return useMutation({
    mutationFn: (payload: TerminalCheckoutRequest) => createTerminalCheckout(payload),
  });
}

export function useTerminalCheckoutStatus(checkoutId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["square", "terminal", "checkout", checkoutId],
    queryFn: () => getTerminalCheckoutStatus(checkoutId!),
    enabled: enabled && !!checkoutId,
    refetchInterval: 3000,
    staleTime: 0,
  });
}
