import type { NotificationType } from "../types/notification";

export type NotificationCategory = "success" | "warning" | "danger" | "info";

export const formatRelativeTime = (dateInput?: Date | string | number | null): string => {
  if (!dateInput) return "";
  const now = new Date();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 45) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const getNotificationCategory = (type: NotificationType): NotificationCategory => {
  switch (type) {
    case "KYC_APPROVED":
    case "REGISTRATION_SUCCESS":
    case "TRANSACTION_SUCCESS":
    case "WALLET_CREDIT":
    case "COMMISSION_CREDIT":
      return "success";

    case "KYC_REJECTED":
    case "TRANSACTION_FAILED":
    case "WALLET_DEBIT":
      return "danger";

    case "MAINTENANCE":
    case "SERVICE_ALERT":
      return "warning";

    case "CMS_PICKUP":
    case "SETTLEMENT":
    case "ANNOUNCEMENT":
    default:
      return "info";
  }
};
