import api from "../config/axiosInstance";

export interface BbpsCategoryItem {
  id: number | string;
  service_name: string;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BbpsCategoriesResponse {
  success?: boolean;
  message?: string;
  status?: boolean | string;
  data?: {
    status?: string;
    categories?: BbpsCategoryItem[];
    data?: {
      categories?: BbpsCategoryItem[];
    };
  };
}

export interface BillerItem {
  id: number | string;
  service_name: string;
  opcode: string;
  service_type: string;
  CUSTNO?: string;
  FIELD1?: string;
  AMT?: string;
  REFMOBILENO?: string;
  state?: string;
  [key: string]: unknown;
}

export interface BillerListResponse {
  status?: boolean | string;
  success?: boolean;
  message?: string;
  data?: BillerItem[] | { billers?: BillerItem[]; data?: BillerItem[] };
}

export interface ViewBillPayload {
  REFMOBILENO: string;
  AMT: string | number;
  CUSTNO: string;
  orderid: string;
  opcode: string;
  service_id: string | number;
  [key: string]: unknown;
}

export interface PayBillPayload {
  REFMOBILENO: string;
  AMT: string | number;
  CUSTNO: string;
  orderid: string;
  opcode: string;
  service_id: string | number;
  amount: number;
  billnumber?: string;
  billdate?: string;
  duedate?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: unknown;
}

/**
 * Fetch all BBPS Categories from backend API (GET /api/v1/bbps/categories)
 */
export const getBbpsCategoriesApi = async (): Promise<BbpsCategoryItem[]> => {
  const response = await api.get<BbpsCategoriesResponse>("/api/v1/bbps/categories");
  const rootData = response.data;

  if (Array.isArray(rootData)) {
    return rootData;
  }
  if (Array.isArray(rootData?.data?.categories)) {
    return rootData.data.categories;
  }
  if (Array.isArray(rootData?.data?.data?.categories)) {
    return rootData.data.data.categories;
  }
  const nested = (rootData as Record<string, unknown>)?.data;
  if (Array.isArray(nested)) {
    return nested as BbpsCategoryItem[];
  }
  return [];
};

/**
 * Fetch all BBPS Billers from backend API (GET /api/v1/bbps/billers)
 */
export const getAllBillersApi = async (): Promise<BillerItem[]> => {
  const response = await api.get<BillerListResponse>("/api/v1/bbps/billers");
  const rootData = response.data;

  if (Array.isArray(rootData)) {
    return rootData;
  }
  if (Array.isArray(rootData?.data)) {
    return rootData.data as BillerItem[];
  }
  if (Array.isArray((rootData?.data as Record<string, unknown>)?.data)) {
    return (rootData?.data as Record<string, unknown>)?.data as BillerItem[];
  }
  if (Array.isArray((rootData?.data as Record<string, unknown>)?.billers)) {
    return (rootData?.data as Record<string, unknown>)?.billers as BillerItem[];
  }
  return [];
};

/**
 * Fetch billers by category ID
 */
export const getBillersByCategoryIdApi = async (
  catId: number | string
): Promise<BillerItem[]> => {
  try {
    const response = await api.post("/api/v1/bbps/billers/by-category-id", {
      cat_id: catId,
    });
    const data = response.data?.data?.billers || response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/**
 * Fetch billers by category name (POST /api/v1/bbps/billers/by-category)
 */
export const getBillersByCategoryNameApi = async (
  catname: string
): Promise<BillerItem[]> => {
  try {
    const response = await api.post("/api/v1/bbps/billers/by-category", {
      catname,
    });
    const rootData = response.data;
    const data =
      rootData?.data?.billers ||
      rootData?.data ||
      rootData?.billers ||
      rootData ||
      [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[BBPS] Failed to fetch billers by category name:", err);
    return [];
  }
};

/**
 * Fetch live bill details
 */
export const viewBillApi = async (payload: ViewBillPayload) => {
  const response = await api.post("/api/v1/bbps/view-bill", payload);
  return response.data;
};

/**
 * Pay bill
 */
export const payBillApi = async (payload: PayBillPayload) => {
  const response = await api.post("/api/v1/bbps/pay-bill", payload);
  return response.data;
};
