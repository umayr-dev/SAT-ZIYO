// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.satziyo.uz",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verifyOtp: "/auth/verify-otp",
    logout: "/auth/logout",
    profile: "/auth/me", // Backend endpoint is /auth/me
    google: "/auth/google",
  },
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
  },
} as const;
