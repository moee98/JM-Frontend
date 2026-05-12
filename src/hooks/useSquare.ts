import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSquareStatus,
  getSquareTransactions,
  getSquareSummary,
  disconnectSquare,
} from "../services/integrationService";

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
