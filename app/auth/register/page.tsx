"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/src/components/auth/register-form";
import { OtpForm } from "@/src/components/auth/otp-form";
import {
  sendOTP,
  verifyOTP,
  checkAuth,
} from "@/src/services/otp-auth-client.service";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

type AuthStep = "register" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // Not authenticated, continue with register flow
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkExistingAuth();
  }, [router]);

  const handleRegister = async (
    nameValue: string,
    emailValue: string,
    password: string,
    confirmPassword: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if user already has a valid session cookie
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        // User already authenticated, redirect immediately without OTP
        router.push("/dashboard");
        return;
      }
    } catch {
      // Not authenticated - this is normal, continue with OTP flow
    }

    // No valid session - send OTP for registration
    try {
      await sendOTP(emailValue, true, password, nameValue); // isRegister = true, password, name
      setEmail(emailValue);
      setName(nameValue);
      setPassword(password); // Store password for resend
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP - this creates the session cookie with user data (including name)
      await verifyOTP(email, code);

      // Redirect to dashboard (session cookie is now set)
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid verification code. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await sendOTP(email, true, password, name); // isRegister = true, password, name
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Build absolute redirect URL using current origin (works for both local and prod)
    const appOrigin =
      typeof window !== "undefined" ? window.location.origin : "";

    // Build full callback URL with redirect parameter
    const callbackUrl = `${appOrigin}/auth/callback?redirect=${encodeURIComponent(
      "/dashboard"
    )}`;

    // Backend expects the full callback URL as redirect parameter
    const googleAuthUrl = `${API_CONFIG.baseURL}${
      API_ENDPOINTS.auth.google
    }?redirect=${encodeURIComponent(callbackUrl)}`;

    // Redirect to backend Google OAuth endpoint
    window.location.href = googleAuthUrl;
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12">
        <OtpForm
          title="Verify Your Email"
          description="Enter the verification code sent to your email"
          email={email}
          onSubmit={handleOtpSubmit}
          onResend={handleResendOtp}
          isLoading={isLoading}
          error={error}
          footerLink={{
            text: "Wrong email?",
            href: "/auth/register",
            linkText: "Go back",
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12">
      <RegisterForm
        onSubmit={handleRegister}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isLoading}
        error={error}
        footerLink={{
          text: "Already have an account?",
          href: "/auth/login",
          linkText: "Sign in",
        }}
      />
    </div>
  );
}
