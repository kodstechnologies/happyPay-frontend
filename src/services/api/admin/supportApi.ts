import api from "../../../config/adminAxiosInstance";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data;

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  retailerId: {
    _id: string;
    mobile: string;
    email: string;
  } | null;
  subject: string;
  category: string;
  otherCategory?: string;
  priority: string;
  description: string;
  status: string;
  attachments: Array<{
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  relatedTransactionId?: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  } | null;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function getAllSupportTickets(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
}) {
  return api
    .get<ApiEnvelope<SupportTicket[]>>("/api/v1/support/tickets", { params })
    .then(unwrap);
}

export function updateTicketStatus(ticketId: string, status: string) {
  return api
    .patch<ApiEnvelope<SupportTicket>>(`/api/v1/support/tickets/${ticketId}/status`, { status })
    .then(unwrap);
}

export function assignTicket(ticketId: string, adminId: string) {
  return api
    .patch<ApiEnvelope<SupportTicket>>(`/api/v1/support/tickets/${ticketId}/assign`, { adminId })
    .then(unwrap);
}
