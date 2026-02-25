/**
 * Authentication Service
 * Password-based registration/login with OTP verification
 * Cookie-based authentication using HttpOnly cookies
 */

import { apiPost, apiGet, apiPatch } from "@/src/lib/api-client";
import { API_ENDPOINTS, API_CONFIG } from "@/src/config/api";
import { tokenStorage } from "@/src/lib/token-storage";
import type {
  AuthResponse,
  UserProfile,
  RegisterCredentials,
  LoginCredentials,
} from "@/src/types";

export const authService = {
  /**
   * Register user with name, email and password
   * Sends OTP to email after successful registration
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.register, {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    });
  },

  /**
   * Login user with email and password
   * Sends OTP to email after successful login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.login, {
      email: credentials.email,
      password: credentials.password,
    });
  },

  /**
   * Verify OTP and get JWT access token
   * Verifies OTP code and returns JWT access token
   */
  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>(API_ENDPOINTS.auth.verifyOtp, {
      email,
      otp: code, // API expects 'otp' field, not 'code'
    });

    // Store JWT token from response
    // API spec: /auth/verify-otp returns JWT access token in response body
    // Try multiple common field names
    const token =
      (response as any).accessToken ||
      (response as any).token ||
      (response as any).access_token ||
      (response as any).jwt;

    if (token && typeof window !== "undefined") {
      // Ensure token is a string
      const tokenString = String(token);
      tokenStorage.setToken(tokenString);
      const storedToken = tokenStorage.getToken();
      if (!storedToken) {
        console.error("Failed to store token in localStorage");
      }
    } else if (typeof window !== "undefined") {
      // Debug: Log response if token is missing
      console.error("Token not found in OTP response:", response);
    }

    return response as AuthResponse;
  },

  /**
   * Google OAuth login
   * Redirects to Google OAuth, then sends OTP to email
   */
  async loginWithGoogle(): Promise<void> {
    // Redirect to API's Google OAuth endpoint
    // API URL is configured in API_CONFIG from environment variable
    if (typeof window !== "undefined") {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      // Qo‘shimcha query param: prompt=select_account – Google har safar
      // account tanlash oynasini ko‘rsatadi (oldingi akkauntga avtomatik kirmaydi)
      const params = new URLSearchParams({
        redirect: redirectUrl,
        prompt: "select_account",
      });
      window.location.href = `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.google}?${params.toString()}`;
    }
  },

  /**
   * Get current user profile
   * Returns authenticated user profile using cookie-based or token-based authentication
   * Uses caching to prevent rate limiting
   */
  async getCurrentUser(): Promise<UserProfile> {
    // Import cache manager dynamically to avoid circular dependencies
    const { userCacheManager } = await import("@/src/lib/user-cache");
    
    // Check cache first
    const cached = userCacheManager.get();
    if (cached) {
      return cached;
    }

    // Use cache manager to prevent multiple simultaneous requests
    return userCacheManager.getOrCreatePromise(async () => {
      // Get token from localStorage as fallback
      const token = tokenStorage.getToken();
      
      // Use our Next.js API route which handles cookie-based auth
      const headers: HeadersInit = {};
      
      // If we have a token in localStorage but not in cookie, send it in header
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Important: include cookies
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and cache
          tokenStorage.removeToken();
          userCacheManager.clear();
          throw new Error("Not authenticated");
        }
        if (response.status === 429) {
          // Rate limited - wait a bit and return cached if available
          const cached = userCacheManager.get();
          if (cached) {
            return cached;
          }
          throw new Error("Too many requests. Please wait a moment.");
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to get user");
      }

      const userData = await response.json();
      return userData;
    });
  },

  /**
   * Update user profile (PATCH /auth/profile)
   * name (2-100), currentPassword/newPassword (8-50), targetScore (400-1600), examDate (ISO 8601)
   */
  async updateProfile(data: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
    targetScore?: number;
    examDate?: string;
  }): Promise<UserProfile> {
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = "Failed to update profile";
      try {
        const error = JSON.parse(text);
        message = error.message || message;
      } catch {
        // response was HTML or non-JSON (e.g. 404 page)
      }
      throw new Error(message);
    }

    const updatedUser = await response.json();
    // Bitta manba: cache ni yangilash, name/targetScore/examDate keyingi getCurrentUser da keladi
    const { userCacheManager } = await import("@/src/lib/user-cache");
    userCacheManager.set(updatedUser);
    return updatedUser;
  },

  /**
   * Logout user
   * Clears JWT token and logs out the user
   * Optimized for fast logout - doesn't wait for backend response
   */
  async logout(): Promise<AuthResponse> {
    // Remove token from storage immediately
    if (typeof window !== "undefined") {
      const { tokenStorage } = await import("@/src/lib/token-storage");
      tokenStorage.removeToken();
    }

    // Call logout API but don't wait for it (fire and forget)
    try {
      // Use fetch directly to avoid waiting
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {
        // Silently handle errors - logout should succeed even if API fails
      });
    } catch (error) {
      // Silently handle errors
    }

    return { success: true };
  },
};
