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
      window.location.href = `${API_CONFIG.baseURL}${
        API_ENDPOINTS.auth.google
      }?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  },

  /**
   * Get current user profile
   * Returns authenticated user profile using JWT Bearer token
   */
  async getCurrentUser(): Promise<UserProfile> {
    return apiGet<UserProfile>(API_ENDPOINTS.auth.profile, {
      requireAuth: true,
    });
  },

  /**
   * Update user profile
   * Updates user profile information
   */
  async updateProfile(data: {
    email?: string;
    name?: string;
  }): Promise<UserProfile> {
    return apiPatch<UserProfile>(API_ENDPOINTS.auth.profile, data, {
      requireAuth: true,
    });
  },

  /**
   * Logout user
   * Clears JWT token and logs out the user
   */
  async logout(): Promise<AuthResponse> {
    try {
      await apiPost<AuthResponse>(API_ENDPOINTS.auth.logout, undefined, {
        requireAuth: true,
      });
    } finally {
      // Always remove token from storage
      if (typeof window !== "undefined") {
        const { tokenStorage } = await import("@/src/lib/token-storage");
        tokenStorage.removeToken();
      }
    }
    return { success: true };
  },
};
