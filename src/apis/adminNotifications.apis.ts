import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

interface Notification {
  _id: string;
  recipientId: string;
  recipientType: "admin" | "retailer";
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  fcmSent?: boolean;
  fcmFailureReason?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
