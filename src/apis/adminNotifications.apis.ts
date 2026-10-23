import api from "../config/adminAxiosInstance";

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
  return api.get<Envelope<NotificationsResponse>>("/api/admin/notifications", { params }).then((response) => response.data.data);
}

export function markNotificationAsRead(notificationId: string) {
  return api.patch<Envelope<Notification>>(`/api/admin/notifications/${notificationId}/read`).then((response) => response.data.data);
}

export function markAllNotificationsAsRead() {
  return api.patch<Envelope<{ modifiedCount: number }>>("/api/admin/notifications/read-all").then((response) => response.data.data);
}
