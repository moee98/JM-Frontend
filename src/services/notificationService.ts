import api from "./apiService";

export interface Notification {
  id: number;
  appUserId: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string;
  entityId?: number;
  createdAt: string;
}

export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const res = await api.get<Notification[]>("/notifications");
  return res.data;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};
