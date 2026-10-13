import { apiClient } from "../client";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

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
  return apiClient<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/categories",
    {
      method: "GET",
    },
  );
}

// ============================================================
// PROPERTY TYPES
// ============================================================

export function getPropertyTypes() {
  return apiClient<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/property-types",
    {
      method: "GET",
    },
  );
}

// ============================================================
// PROOF TYPES (Business Proof)
// ============================================================

export function getProofTypes() {
  return apiClient<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/proof-types",
    {
      method: "GET",
    },
  );
}

// ============================================================
// EDUCATIONAL QUALIFICATIONS
// ============================================================

export function getEducationalQualifications() {
  return apiClient<ApiEnvelope<MasterDataListResult>>(
    "/api/v1/master-data/educational-qualifications",
    {
      method: "GET",
    },
  );
}