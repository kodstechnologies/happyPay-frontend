import api from "../../../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data.data;

export interface MasterDataItem {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MasterDataListResult = MasterDataItem[];

// ============================================================
// CATEGORIES
// ============================================================

export function getCategories() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/categories",
    { params: { limit: 100 } }
  ).then(unwrap);
}

export function createCategory(name: string) {
  return api.post<ApiEnvelope<MasterDataItem>>(
    "/api/v1/master-data/categories",
    { name }
  ).then(unwrap);
}

export function updateCategory(id: string, name: string, isActive: boolean) {
  return api.patch<ApiEnvelope<MasterDataItem>>(
    `/api/v1/master-data/categories/${id}`,
    { name, isActive }
  ).then(unwrap);
}

export function deleteCategory(id: string) {
  return api.delete<ApiEnvelope<{ message: string }>>(
    `/api/v1/master-data/categories/${id}`
  ).then(unwrap);
}

// ============================================================
// PROPERTY TYPES
// ============================================================

export function getPropertyTypes() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/property-types",
    { params: { limit: 100 } }
  ).then(unwrap);
}

export function createPropertyType(name: string) {
  return api.post<ApiEnvelope<MasterDataItem>>(
    "/api/v1/master-data/property-types",
    { name }
  ).then(unwrap);
}

export function updatePropertyType(id: string, name: string, isActive: boolean) {
  return api.patch<ApiEnvelope<MasterDataItem>>(
    `/api/v1/master-data/property-types/${id}`,
    { name, isActive }
  ).then(unwrap);
}

export function deletePropertyType(id: string) {
  return api.delete<ApiEnvelope<{ message: string }>>(
    `/api/v1/master-data/property-types/${id}`
  ).then(unwrap);
}

// ============================================================
// PROOF TYPES (Business Proof)
// ============================================================

export function getProofTypes() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/proof-types",
    { params: { limit: 100 } }
  ).then(unwrap);
}

export function createProofType(name: string) {
  return api.post<ApiEnvelope<MasterDataItem>>(
    "/api/v1/master-data/proof-types",
    { name }
  ).then(unwrap);
}

export function updateProofType(id: string, name: string, isActive: boolean) {
  return api.patch<ApiEnvelope<MasterDataItem>>(
    `/api/v1/master-data/proof-types/${id}`,
    { name, isActive }
  ).then(unwrap);
}

export function deleteProofType(id: string) {
  return api.delete<ApiEnvelope<{ message: string }>>(
    `/api/v1/master-data/proof-types/${id}`
  ).then(unwrap);
}