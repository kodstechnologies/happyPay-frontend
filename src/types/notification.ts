export type NotificationType =
  | "TRANSACTION_SUCCESS"
  | "TRANSACTION_FAILED"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "COMMISSION_CREDIT"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "CMS_PICKUP"
  | "SETTLEMENT"
  | "ANNOUNCEMENT"
  | "SERVICE_ALERT"
  | "MAINTENANCE"
  | "REGISTRATION_SUCCESS"
  | "NEW_RETAILER_REGISTRATION"
  | string;

export interface NotificationItem {
  _id: string;
  recipientId: string;
  recipientType: "admin" | "retailer";
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | Date | null;
  createdAt: string | Date;
  fcmSent?: boolean;
  fcmFailureReason?: string | null;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  unread?: boolean;
}
