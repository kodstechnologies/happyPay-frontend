import { apiClient } from "../client";
import { getAdminToken } from "../../../utils/adminAuth";

export interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  position: "top" | "middle" | "bottom";
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BannerFormData = Omit<Banner, "_id" | "createdAt" | "updatedAt">;

interface Envelope<T> { data: T; message?: string }

export function getAdminBanners() {
  return apiClient<Envelope<Banner[]>>(`/api/v1/banners`, { token: getAdminToken() ?? undefined, method: "GET" });
}

export function createAdminBanner(data: BannerFormData) {
  return apiClient<Envelope<Banner>>(`/api/v1/banners`, { 
    token: getAdminToken() ?? undefined, 
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateAdminBanner(id: string, data: BannerFormData) {
  return apiClient<Envelope<Banner>>(`/api/v1/banners/${id}`, { 
    token: getAdminToken() ?? undefined, 
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteAdminBanner(id: string) {
  return apiClient<Envelope<null>>(`/api/v1/banners/${id}`, { 
    token: getAdminToken() ?? undefined, 
    method: "DELETE" 
  });
}
