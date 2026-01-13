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

      // No valid session - send OTP for registration
      // Password is not used in OTP flow, kept for UI consistency
      await sendOTP(emailValue, true); // isRegister = true
      setEmail(emailValue);
      setName(nameValue);
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
      await verifyOTP(email, code, name, true); // isRegister = true

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
      await sendOTP(email, true); // isRegister = true
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
    // Build redirect URL for callback
    const googleAuthUrl = `${API_CONFIG.baseURL}${
      API_ENDPOINTS.auth.google
    }?redirect=${encodeURIComponent(
      `/auth/callback?redirect=${encodeURIComponent("/dashboard")}`
    )}`;

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
