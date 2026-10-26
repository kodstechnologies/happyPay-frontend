import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";

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

interface Envelope<T> {
  data: T;
  message?: string;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

export function getAdminBanners() {
  return api.get<Envelope<Banner[]>>(`/api/v1/banners`).then(unwrap);
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
  return api.post<Envelope<Banner>>(`/api/v1/banners`, bannerFormData(data, image)).then(unwrap);
}

export function updateAdminBanner(id: string, data: BannerFormData, image?: File | null) {
  return api.put<Envelope<Banner>>(`/api/v1/banners/${id}`, bannerFormData(data, image)).then(unwrap);
}

export function deleteAdminBanner(id: string) {
  return api.delete<Envelope<null>>(`/api/v1/banners/${id}`).then(unwrap);
}
