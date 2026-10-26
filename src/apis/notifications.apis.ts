import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";
import type {
  NotificationItem,
  NotificationsResponse,
  NotificationQueryParams,
} from "../types/notification";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>): T => response.data.data;

/**
 * Fetch paginated notifications for the authenticated user.
 */
export function getNotifications(params?: NotificationQueryParams): Promise<NotificationsResponse> {
  return api
    .get<Envelope<NotificationsResponse>>("/api/v1/notifications", { params })
    .then(unwrap);
}

/**
 * Mark a single notification as read.
 */
export function markNotificationAsRead(notificationId: string): Promise<NotificationItem> {
  return api
    .patch<Envelope<NotificationItem>>(`/api/v1/notifications/${notificationId}/read`)
    .then(unwrap);
}

/**
 * Mark all unread notifications for the authenticated user as read.
 */
export function markAllNotificationsAsRead(): Promise<{ modifiedCount: number }> {
  return api
    .patch<Envelope<{ modifiedCount: number }>>("/api/v1/notifications/read-all")
    .then(unwrap);
}
