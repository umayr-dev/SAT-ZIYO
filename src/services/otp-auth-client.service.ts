/**
 * OTP Authentication Client Service
 * Cookie-based authentication - no localStorage usage
 * All authentication state is stored in HttpOnly cookies
 */

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Send OTP to email
 * @param email - User's email address
 * @param isRegister - Whether this is for registration (default: false)
 * @param password - User's password (required for backend API)
 * @param name - User's name (required for registration)
 */
export async function sendOTP(
  email: string,
  isRegister: boolean = false,
  password?: string,
  name?: string
): Promise<SendOTPResponse> {
  const response = await fetch("/api/auth/otp/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify({ email, isRegister, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send OTP");
  }

  return response.json();
}

/**
 * Verify OTP and create session
 * @param email - User's email address
 * @param otp - OTP code to verify
 * @param name - User's name (optional, for registration)
 * @param isRegister - Whether this is for registration (default: false)
 */
export async function verifyOTP(
  email: string,
  otp: string,
  name?: string,
  isRegister: boolean = false
): Promise<VerifyOTPResponse> {
  const response = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify({ email, otp, name, isRegister }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to verify OTP");
  }

  return response.json();
}

/**
 * Get current authenticated user
 * Returns user if authenticated, throws if not
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || "Failed to get user");
  }

  return response.json();
}

/**
 * Check if user is authenticated
 * Returns true if authenticated, false otherwise
 */
export async function checkAuth(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to logout");
  }

  return response.json();
}
