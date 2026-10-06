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

function bannerFormData(data: BannerFormData, image?: File | null) {
  const body = new FormData();
  body.append("title", data.title);
  body.append("targetUrl", data.targetUrl || "");
  body.append("position", data.position);
  body.append("order", String(data.order));
  body.append("isActive", String(data.isActive));
  if (image) {
    body.append("image", image);
  }
  return body;
}

export function createAdminBanner(data: BannerFormData, image: File) {
  return apiClient<Envelope<Banner>>(`/api/v1/banners`, { 
    token: getAdminToken() ?? undefined, 
    method: "POST",
    body: bannerFormData(data, image),
  });
}

export function updateAdminBanner(id: string, data: BannerFormData, image?: File | null) {
  return apiClient<Envelope<Banner>>(`/api/v1/banners/${id}`, { 
    token: getAdminToken() ?? undefined, 
    method: "PUT",
    body: bannerFormData(data, image),
  });
}

export function deleteAdminBanner(id: string) {
  return apiClient<Envelope<null>>(`/api/v1/banners/${id}`, { 
    token: getAdminToken() ?? undefined, 
    method: "DELETE" 
  });
}
