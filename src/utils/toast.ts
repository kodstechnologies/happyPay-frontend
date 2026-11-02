import { toast, type ToastOptions } from "react-toastify";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ApiErrorResponse {
  response?: {
    status?: number;
    data?:
      | {
          success?: boolean;
          message?: string;
          msg?: string;
          error?: string;
          errors?: Array<string | { message?: string }> | Record<string, string>;
          data?: {
            message?: string;
            msg?: string;
            error?: string;
            errors?: Array<string | { message?: string }>;
          };
        }
      | string;
  };
  data?: {
    message?: string;
    msg?: string;
    error?: string;
    details?: { msg?: string };
  };
  details?: { msg?: string };
  message?: string;
  statusCode?: number;
}

/**
 * Extracts the exact human-readable error message thrown by the backend API.
 * Safely inspects Axios responses, fetch errors, validation error arrays, and fallback strings.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (!error) return fallback;

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (typeof error === "object" && error !== null) {
    const apiErr = error as ApiErrorResponse;
    const resData = apiErr.response?.data;

    // 1. Direct string returned by backend
    if (typeof resData === "string" && resData.trim()) {
      return resData.trim();
    }

    if (typeof resData === "object" && resData !== null) {
      // 2. Direct message, msg, or error field from backend ApiResponse
      const directMsg = (resData as { message?: string; msg?: string; error?: string }).message ||
                        (resData as { message?: string; msg?: string; error?: string }).msg ||
                        (resData as { message?: string; msg?: string; error?: string }).error;
      if (typeof directMsg === "string" && directMsg.trim()) {
        return directMsg.trim();
      }

      // 3. Nested data message (e.g. resData.data.message)
      const innerData = (resData as { data?: { message?: string; msg?: string; error?: string; errors?: unknown[] } }).data;
      if (typeof innerData === "object" && innerData !== null) {
        const nestedMsg = innerData.message || innerData.msg || innerData.error;
        if (typeof nestedMsg === "string" && nestedMsg.trim()) {
          return nestedMsg.trim();
        }
      }

      // 4. Array of validation errors (e.g. Mongoose, Joi, or express-validator)
      const errorsList = (resData as { errors?: unknown[] }).errors || innerData?.errors;
      if (Array.isArray(errorsList) && errorsList.length > 0) {
        const first = errorsList[0];
        if (typeof first === "string" && first.trim()) return first.trim();
        if (typeof first === "object" && first !== null) {
          const firstMsg = (first as { message?: string; msg?: string }).message || (first as { message?: string; msg?: string }).msg;
          if (typeof firstMsg === "string" && firstMsg.trim()) return firstMsg.trim();
        }
      }
    }

    // 5. Check if error object itself has custom data / details (e.g. AePS/DMT provider responses)
    if (typeof apiErr.data === "object" && apiErr.data !== null) {
      const dataMsg =
        apiErr.data.message ||
        apiErr.data.msg ||
        apiErr.data.error ||
        apiErr.data.details?.msg;
      if (typeof dataMsg === "string" && dataMsg.trim()) {
        return dataMsg.trim();
      }
    }

    if (typeof apiErr.details === "object" && apiErr.details !== null && typeof apiErr.details.msg === "string") {
      return apiErr.details.msg.trim();
    }

    // 6. Native Error message (ignoring Axios default HTTP status strings)
    if (
      typeof apiErr.message === "string" &&
      apiErr.message.trim() &&
      !apiErr.message.toLowerCase().startsWith("request failed with status code")
    ) {
      return apiErr.message.trim();
    }
  }

  if (
    error instanceof Error &&
    error.message &&
    !error.message.toLowerCase().startsWith("request failed with status code")
  ) {
    return error.message.trim();
  }

  return fallback;
}

/**
 * Unified Toast Dispatcher
 * Automatically displays the right toast based on condition (boolean) or type string.
 *
 * @param typeOrCondition - "success" | "error" | "info" | "warning" OR a boolean condition (true = success, false = error)
 * @param content - String message, Error object, Axios error, or response object
 * @param fallback - Optional fallback message if extraction is empty
 * @param options - Optional react-toastify options
 */
export function showToast(
  typeOrCondition: ToastType | boolean,
  content: unknown,
  fallback?: string,
  options?: ToastOptions
): string {
  // Automatically resolve boolean conditions: true -> "success", false -> "error"
  const resolvedType: ToastType =
    typeof typeOrCondition === "boolean"
      ? typeOrCondition
        ? "success"
        : "error"
      : typeOrCondition;

  // Handle ERROR: extract actual API error message
  if (resolvedType === "error") {
    const message = extractApiErrorMessage(content, fallback);
    toast.error(message, options);
    return message;
  }

  // Handle SUCCESS / INFO / WARNING: extract string or response message
  const message =
    typeof content === "string"
      ? content.trim()
      : (content as { message?: string; msg?: string })?.message ||
        (content as { message?: string; msg?: string })?.msg ||
        fallback ||
        "";

  if (!message) return "";

  switch (resolvedType) {
    case "success":
      toast.success(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    case "info":
      toast.info(message, options);
      break;
  }

  return message;
}

export default showToast;
