/**
 * JWT Token Storage
 * Stores JWT access token in localStorage for authenticated requests
 */

const TOKEN_KEY = "auth_token";

export const tokenStorage = {
  /**
   * Store JWT access token
   */
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Get JWT access token
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  /**
   * Remove JWT access token
   */
  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return !!this.getToken();
  },
};
