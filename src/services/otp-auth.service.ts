/**
 * OTP Authentication Service
 * Cookie-based authentication using HttpOnly cookies
 * No localStorage usage - all tokens stored in secure cookies
 */

import { apiPost, apiGet } from "@/src/lib/api-client";
import { API_ENDPOINTS } from "@/src/config/api";
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  AuthResponse,
  UserProfile,
} from "@/src/types";

export const otpAuthService = {
  /**
   * Register user and send OTP
   * Creates new user if not exists and sends 6-digit OTP to email
   */
  async register(email: string): Promise<AuthResponse> {
    const request: SendOtpRequest = { email };
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.register, request);
  },

  /**
   * Login user and send OTP
   * Sends OTP to existing user's email for login
   */
  async login(email: string): Promise<AuthResponse> {
    const request: SendOtpRequest = { email };
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.login, request);
  },

  /**
   * Verify OTP and create session
   * Verifies OTP code and sets secure HttpOnly session cookie
   */
  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const request: VerifyOtpRequest = { email, otp: code };
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.verifyOtp, request);
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
   * Logout user
   * Clears session cookie and logs out the user
   */
  async logout(): Promise<AuthResponse> {
    return apiPost<AuthResponse>(API_ENDPOINTS.auth.logout);
  },
};
