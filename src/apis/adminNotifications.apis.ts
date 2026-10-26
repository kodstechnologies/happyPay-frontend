import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

import type { NotificationItem as Notification, NotificationsResponse } from "../types/notification";
export type { Notification, NotificationsResponse };

export function getNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}) {
  return api.get<Envelope<NotificationsResponse>>("/api/v1/auth/admin/notifications", { params }).then(unwrap);
}

export function markNotificationAsRead(notificationId: string) {
  return api.patch<Envelope<Notification>>(`/api/v1/auth/admin/notifications/${notificationId}/read`).then(unwrap);
}

export function markAllNotificationsAsRead() {
  return api.patch<Envelope<{ modifiedCount: number }>>("/api/v1/auth/admin/notifications/read-all").then(unwrap);
}
