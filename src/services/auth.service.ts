import { createClient } from "@/src/lib/supabase/client";
import { apiService } from "./api";
import { API_ENDPOINTS } from "@/src/config/api";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "@/src/types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Login failed");
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
      createdAt: data.user.created_at,
    };

    return {
      user,
      token: data.session.access_token,
    };
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const supabase = createClient();
    const { confirmPassword, ...registerData } = credentials;

    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        emailRedirectTo: `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registration failed");
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
      createdAt: data.user.created_at,
    };

    const token = data.session?.access_token || "";

    return {
      user,
      token,
    };
  },

  signInWithGoogle: async (): Promise<void> => {
    const supabase = createClient();

    if (typeof window === "undefined") {
      throw new Error("Google sign in can only be called from the client side");
    }

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      throw new Error(
        error.message ||
          "Failed to initiate Google sign in. Please check your Supabase Google provider settings."
      );
    }

    // If data.url exists, the redirect will happen automatically
    // Otherwise, there might be a configuration issue
    if (!data?.url) {
      throw new Error(
        "Google OAuth configuration error. Please ensure Google provider is enabled in Supabase and credentials are correct."
      );
    }
  },

  logout: async (): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(error?.message || "User not found");
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      createdAt: user.created_at,
    };
  },
};
