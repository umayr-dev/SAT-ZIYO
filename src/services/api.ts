/**
 * Legacy API Service - Cookie-based Authentication
 *
 * ⚠️ DEPRECATED: Use api-client.ts instead for new code
 * This service is kept for backward compatibility but uses secure cookie-based auth
 *
 * SECURITY: No localStorage usage - all tokens stored in HttpOnly cookies
 */

import { API_CONFIG } from "@/src/config/api";
import type { ApiResponse, ApiError } from "@/src/types";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      ...API_CONFIG.headers,
      ...(options.headers as Record<string, string>),
    };

    // SECURITY: Use cookie-based auth instead of localStorage token
    // Cookies are automatically sent with credentials: 'include'
    const config: RequestInit = {
      ...options,
      headers: headers as HeadersInit,
      credentials: "include", // Critical for HttpOnly cookie authentication
      mode: "cors",
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || "An error occurred",
          code: data.code,
          status: response.status,
        } as ApiError;
      }

      return data;
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        throw error as ApiError;
      }
      throw {
        message: "Network error. Please try again.",
        code: "NETWORK_ERROR",
      } as ApiError;
    }
  }

  /**
   * @deprecated Token-based auth is deprecated. Use cookie-based auth instead.
   * This method is kept for backward compatibility but does nothing.
   */
  private getToken(): string | null {
    // SECURITY: No localStorage usage - tokens are in HttpOnly cookies
    return null;
  }

  /**
   * @deprecated Token-based auth is deprecated. Use cookie-based auth instead.
   * This method is kept for backward compatibility but does nothing.
   */
  setToken(token: string): void {
    // SECURITY: No localStorage usage - tokens are set by API server in HttpOnly cookies
    console.warn(
      "setToken() is deprecated. Tokens are now stored in HttpOnly cookies by the API server."
    );
  }

  /**
   * @deprecated Token-based auth is deprecated. Use cookie-based auth instead.
   * This method is kept for backward compatibility but does nothing.
   */
  removeToken(): void {
    // SECURITY: No localStorage usage - cookies are cleared by API server on logout
    console.warn(
      "removeToken() is deprecated. Cookies are cleared by the API server on logout."
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiService = new ApiService();
