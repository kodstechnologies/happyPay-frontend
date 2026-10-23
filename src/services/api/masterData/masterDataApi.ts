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
    "/api/v1/master-data/categories"
  ).then(unwrap);
}

// ============================================================
// PROPERTY TYPES
// ============================================================

export function getPropertyTypes() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/property-types"
  ).then(unwrap);
}

// ============================================================
// PROOF TYPES (Business Proof)
// ============================================================

export function getProofTypes() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/proof-types"
  ).then(unwrap);
}

// ============================================================
// EDUCATIONAL QUALIFICATIONS
// ============================================================

export function getEducationalQualifications() {
  return api.get<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/educational-qualifications"
  ).then(unwrap);
}