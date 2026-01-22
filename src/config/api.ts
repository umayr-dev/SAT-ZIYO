// API Configuration
// NOTE:
// - For browser code we use NEXT_PUBLIC_API_URL
// - For server-side (Next API routes) we prefer BACKEND_API_URL if defined
const RUNTIME_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.satziyo.uz";

export const API_CONFIG = {
  baseURL: RUNTIME_BASE_URL,
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
  exams: {
    dates: "/exams/dates",
    select: "/exams/select",
  },
} as const;
