// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
}

// Auth types
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string; // API expects 'otp' field
}

export interface AuthResponse {
  accessToken?: string; // JWT access token from verify-otp endpoint
  token?: string; // Alternative field name for JWT token
  success?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  targetScore?: number;
  examDate?: string; // ISO 8601
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
