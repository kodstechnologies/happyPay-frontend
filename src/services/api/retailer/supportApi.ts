import api from "../../../config/axiosInstance";
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
  retailerId: string;
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
  createdAt: string;
  updatedAt: string;
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

export function getRetailerSupportTickets(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  category?: string;
  priority?: string;
}) {
  return api
    .get<ApiEnvelope<SupportTicket[]>>("/api/v1/support/retailer/tickets", { params })
    .then(unwrap);
}

export function createSupportTicket(payload: FormData) {
  return api
    .post<ApiEnvelope<SupportTicket>>("/api/v1/support/tickets", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(unwrap);
}
