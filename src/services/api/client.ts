const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";

interface ApiOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const isFormData = fetchOptions.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
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
    throw new Error(
      response.status === 404
        ? "API endpoint was not found. Restart the backend server."
        : "The backend returned an unexpected response. Check that the backend is running.",
    );
  }

  if (!response.ok) {
    throw new Error((data as { message?: string })?.message || "Something went wrong");
  }

  return data;
}