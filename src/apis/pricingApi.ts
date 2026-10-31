import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";

// Pricing Slab
export interface PricingSlab {
  minAmount: number;
  maxAmount: number | null;
  value?: number;
  adminAmount?: number | null;
  distributorAmount?: number | null;
  retailerAmount?: number | null;
}

// Pricing
export interface Pricing {
  _id?: string;
  type: "COMMISSION" | "CHARGE";
  calculationType: "FIXED" | "PERCENTAGE";
  slabs: PricingSlab[];
}

// Plan Category
export interface PlanCategory {
  _id?: string;
  categoryName: string;
  pricing: Pricing[];
}

// Plan Service
export interface PlanService {
  _id?: string;
  serviceId: string;
  categories: PlanCategory[];
  pricing?: Pricing[];
}

// Plan
export interface Plan {
  _id: string;
  name: string;
  image: string;
  description: string;
  validityPeriod: number;
  validityUnit: "DAYS" | "MONTHS" | "YEARS";
  services: PlanService[];
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
  isSubscribed?: boolean;
}

// Form data types (without _id, createdAt, updatedAt)
export type PlanFormData = Omit<Plan, "_id" | "createdAt" | "updatedAt">;

// Query params for listing plans
export interface PlanListFilters {
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "newest" | "oldest" | "name" | "validity";
}

interface Envelope<T> {
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

// Custom unwrap for paginated list responses where data is nested
const unwrapList = <T,>(response: AxiosResponse<Envelope<{ data: T; pagination: PaginationMeta }>>) => response.data.data.data;

// GET /api/v1/pricing - Get all plans
export function getPlans(filters: PlanListFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  const endpoint = `/api/v1/pricing${queryString ? `?${queryString}` : ""}`;
  return api.get<Envelope<{ data: Plan[]; pagination: PaginationMeta }>>(endpoint).then(unwrapList);
}

// GET /api/v1/pricing/:id - Get plan by ID
export function getPlanById(id: string) {
  return api.get<Envelope<Plan>>(`/api/v1/pricing/${id}`).then(unwrap);
}

// Helper function to convert PlanFormData to FormData for file upload
function planFormData(data: Partial<PlanFormData>, image?: File | null) {
  const body = new FormData();

  // Append simple fields
  if (data.name !== undefined) body.append("name", data.name);
  if (data.description !== undefined) body.append("description", data.description);
  if (data.status !== undefined) body.append("status", data.status);

  // Append validity period fields
  if (data.validityPeriod !== undefined) {
    body.append("validityPeriod", String(data.validityPeriod));
  }
  if (data.validityUnit !== undefined) {
    body.append("validityUnit", data.validityUnit);
  }

  // Append image if provided
  if (image) {
    body.append("image", image);
  }

  return body;
}

// POST /api/v1/pricing - Create plan (with optional image upload)
export function createPlan(data: Partial<PlanFormData>, image?: File | null) {
  return api.post<Envelope<Plan>>(
    `/api/v1/pricing`,
    planFormData(data, image)
  ).then(unwrap);
}

// PUT /api/v1/pricing/:id - Update plan (with optional image upload)
export function updatePlan(id: string, data: Partial<PlanFormData>, image?: File | null) {
  return api.put<Envelope<Plan>>(
    `/api/v1/pricing/${id}`,
    planFormData(data, image)
  ).then(unwrap);
}

// DELETE /api/v1/pricing/:id - Delete plan
export function deletePlan(id: string) {
  return api.delete<Envelope<{ message: string }>>(`/api/v1/pricing/${id}`).then(unwrap);
}

// PATCH /api/v1/pricing/:id/services - Configure plan services
export function configurePlanServices(id: string, services: PlanService[]) {
  return api.patch<Envelope<Plan>>(
    `/api/v1/pricing/${id}/services`,
    { services }
  ).then(unwrap);
}

// Subscription interface
export interface UserSubscription {
  _id: string;
  planId: Plan | string;
  userId: string;
  subscribedAt: string;
  cancelledAt: string | null;
  expiresAt: string;
  isExpired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// PATCH /api/v1/pricing/:id/subscribe - Subscribe to a plan
export function subscribeToPlan(planId: string) {
  return api.patch<Envelope<UserSubscription>>(
    `/api/v1/pricing/${planId}/subscribe`
  ).then(unwrap);
}

// Query params for subscribed plans
export interface SubscribedPlansFilters {
  activeOnly?: boolean;
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "newest" | "oldest" | "expiry" | "planName";
}

// GET /api/v1/pricing/subscribed-plans - Get subscribed plans for the authenticated user
export function getSubscribedPlans(filters: SubscribedPlansFilters = {}) {
  const params = new URLSearchParams();
  if (filters.activeOnly) {
    params.set("activeOnly", "true");
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.page) {
    params.set("page", String(filters.page));
  }
  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }
  const queryString = params.toString();
  const endpoint = `/api/v1/pricing/subscribed-plans${queryString ? `?${queryString}` : ""}`;
  return api.get<Envelope<UserSubscription[]>>(endpoint).then(unwrap);
}


