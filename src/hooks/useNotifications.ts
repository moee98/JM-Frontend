import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

const QUERY_KEY = ["notifications", "unread"];

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getUnreadNotifications,
    refetchInterval: 30_000, // poll every 30 seconds
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
