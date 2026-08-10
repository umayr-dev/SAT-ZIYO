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
    // Rate limited. Tell the student how long to wait instead of showing a
    // generic failure — otherwise they hammer the button, which keeps the
    // bucket permanently saturated and makes the queue worse for the whole
    // cohort. This is the difference between a 30-second delay and a room full
    // of students who cannot log in at all.
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const seconds =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.ceil(retryAfter)
          : 60;
      throw new Error(
        `Too many sign-in attempts. Please wait ${seconds} second${
          seconds === 1 ? "" : "s"
        } and try again — do not keep pressing the button.`,
      );
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to send OTP");
  }

  return response.json();
}

/**
 * Verify OTP and create session.
 * BACKEND TALABI: faqat email va otp yuboriladi.
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<VerifyOTPResponse> {
  const response = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify({ email, otp }),
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
 * Uses caching to prevent rate limiting
 */
export async function getCurrentUser(): Promise<UserResponse> {
  // Import cache manager dynamically to avoid circular dependencies
  const { userCacheManager } = await import("@/src/lib/user-cache");
  
  // Check cache first
  const cached = userCacheManager.get();
  if (cached) {
    return cached;
  }

  // Use cache manager to prevent multiple simultaneous requests
  return userCacheManager.getOrCreatePromise(async () => {
    const headers: HeadersInit = {};

    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include", // Important: include cookies
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
        }
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to get user");
    }

    const userData = await response.json();
    return userData;
  });
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
  // Har ehtimolga qarshi localStorage dagi eski tokenni ham tozalaymiz
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth_token");
    } catch {
      // ignore
    }
  }
  
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
