const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";

export interface ApiError extends Error {
  statusCode?: number;
  data?: unknown;
  meta?: unknown;
}

interface ApiOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, params, ...fetchOptions } = options;

  const isFormData = fetchOptions.body instanceof FormData;

  // Build URL with query parameters
  let url = `${API_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,

    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),

      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),

      ...fetchOptions.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();
  let data: T | { message?: string };

  if (contentType.includes("application/json")) {
    data = rawBody ? (JSON.parse(rawBody) as T) : ({} as T);
  } else {
    const err: ApiError = new Error(
      response.status === 404
        ? "API endpoint was not found. Restart the backend server."
        : "The backend returned an unexpected response. Check that the backend is running."
    );
    err.statusCode = response.status;
    throw err;
  }

  if (!response.ok) {
    const errorData = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
    const message = (typeof errorData.message === "string" ? errorData.message : "") || "Something went wrong";
    const error: ApiError = new Error(message);
    error.statusCode = typeof errorData.statusCode === "number" ? errorData.statusCode : response.status;
    error.data = errorData.data;
    error.meta = errorData.meta;
    throw error;
  }

  return data;
}
