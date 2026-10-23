import { apiClient } from "../client";
import { getAdminToken } from "../../../utils/adminAuth";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

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
  return apiClient<Envelope<NotificationsResponse>>("/api/admin/notifications", {
    token: getAdminToken() || undefined,
    method: "GET",
    params,
  });
}

export function markNotificationAsRead(notificationId: string) {
  return apiClient<Envelope<Notification>>(`/api/admin/notifications/${notificationId}/read`, {
    token: getAdminToken() || undefined,
    method: "PATCH",
  });
}

export function markAllNotificationsAsRead() {
  return apiClient<Envelope<{ modifiedCount: number }>>("/api/admin/notifications/read-all", {
    token: getAdminToken() || undefined,
    method: "PATCH",
  });
}
