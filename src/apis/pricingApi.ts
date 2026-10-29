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
  categoryId: string;
  pricing: Pricing[];
}

// Plan Service
export interface PlanService {
  _id?: string;
  serviceId: string;
  categories: PlanCategory[];
}

// Plan
export interface Plan {
  _id: string;
  name: string;
  image: string;
  description: string;
  services: PlanService[];
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

// Form data types (without _id, createdAt, updatedAt)
export type PlanFormData = Omit<Plan, "_id" | "createdAt" | "updatedAt">;

// Query params for listing plans
export interface PlanListFilters {
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
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

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

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
  return api.get<Envelope<Plan[]>>(endpoint).then(unwrap);
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

  // Append image if provided
  if (image) {
    body.append("image", image);
  }

  // Append services as JSON string
  if (data.services !== undefined) {
    body.append("services", JSON.stringify(data.services));
  }

  return body;
}

// POST /api/v1/pricing - Create plan (with image upload)
export function createPlan(data: Partial<PlanFormData>, image: File) {
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
