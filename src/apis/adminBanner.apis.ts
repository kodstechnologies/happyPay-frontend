import api from "../config/axiosInstance";
import type { AxiosResponse } from "axios";

export interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  position?: "top" | "middle" | "bottom";
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type BannerFormData = Omit<Banner, "_id" | "createdAt" | "updatedAt">;

interface Envelope<T> {
  data: T;
  message?: string;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

const ADMIN_BANNERS_BASE = "/api/admin/banners";

export function getAdminBanners() {
  return api.get<Envelope<Banner[]>>(`${ADMIN_BANNERS_BASE}`).then(unwrap);
}

function bannerFormData(data: BannerFormData, image?: File | null) {
  const body = new FormData();
  body.append("title", data.title || "");
  if (data.isActive !== undefined) {
    body.append("isActive", String(data.isActive));
  }
  if (data.position) {
    body.append("position", data.position);
  }
  if (data.order !== undefined && data.order !== null) {
    body.append("order", String(data.order));
  }
  if (image) {
    body.append("image", image);
  }
  return body;
}

export function createAdminBanner(data: BannerFormData, image: File) {
  return api.post<Envelope<Banner>>(`${ADMIN_BANNERS_BASE}`, bannerFormData(data, image)).then(unwrap);
}

export function updateAdminBanner(id: string, data: BannerFormData, image?: File | null) {
  return api.put<Envelope<Banner>>(`${ADMIN_BANNERS_BASE}/${id}`, bannerFormData(data, image)).then(unwrap);
}

export function deleteAdminBanner(id: string) {
  return api.delete<Envelope<null>>(`${ADMIN_BANNERS_BASE}/${id}`).then(unwrap);
}
