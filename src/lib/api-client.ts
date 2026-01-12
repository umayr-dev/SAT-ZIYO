/**
 * Secure API Client for JWT Bearer Token Authentication
 * Uses Authorization: Bearer <token> header for authenticated requests
 */

import { API_CONFIG } from "@/src/config/api";
import type { ApiError } from "@/src/types";
import { tokenStorage } from "./token-storage";

export interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiClientError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Secure fetch wrapper with JWT Bearer token authentication
 * Automatically includes Authorization header for authenticated requests
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { requireAuth = false, ...fetchOptions } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_CONFIG.baseURL}${endpoint}`;

  const headers = new Headers(fetchOptions.headers);

  // Set Content-Type if not already set and body exists
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add Authorization header for authenticated requests
  if (requireAuth) {
    const token = tokenStorage.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
    mode: "cors", // Allow CORS if needed
  };

  try {
    const response = await fetch(url, requestOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    let data: unknown;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage =
        (data as { message?: string })?.message ||
        (data as { error?: string })?.error ||
        `HTTP ${response.status}: ${response.statusText}`;

      throw new ApiClientError(
        errorMessage,
        response.status,
        (data as { code?: string })?.code
      );
    }

    return data as T;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiClientError(
        "Network error. Please check your connection.",
        0,
        "NETWORK_ERROR"
      );
    }

    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Unknown errors
    throw new ApiClientError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
      "UNKNOWN_ERROR"
    );
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "GET",
  });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: ApiClientOptions
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "DELETE",
  });
}
