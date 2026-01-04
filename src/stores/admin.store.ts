import { create } from "zustand";

interface AdminState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Static credentials for testing
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "12345";

// Load from localStorage on initialization
const loadAdminState = () => {
  if (typeof window === "undefined")
    return { isAdminAuthenticated: false, adminUsername: null };

  try {
    const stored = localStorage.getItem("admin-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isAdminAuthenticated: parsed.state?.isAdminAuthenticated || false,
        adminUsername: parsed.state?.adminUsername || null,
      };
    }
  } catch (error) {
    console.error("Error loading admin state:", error);
  }

  return { isAdminAuthenticated: false, adminUsername: null };
};

const initialState = loadAdminState();

export const useAdminStore = create<AdminState>((set) => ({
  isAdminAuthenticated: initialState.isAdminAuthenticated,
  adminUsername: initialState.adminUsername,
  login: (username: string, password: string) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const newState = {
        isAdminAuthenticated: true,
        adminUsername: username,
      };
      set(newState);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "admin-storage",
            JSON.stringify({ state: newState })
          );
        } catch (error) {
          console.error("Error saving admin state:", error);
        }
      }

      return true;
    }
    return false;
  },
  logout: () => {
    const newState = {
      isAdminAuthenticated: false,
      adminUsername: null,
    };
    set(newState);

    // Clear from localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("admin-storage");
      } catch (error) {
        console.error("Error clearing admin state:", error);
      }
    }
  },
}));
