"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/src/components/auth/login-form";
import { OtpForm } from "@/src/components/auth/otp-form";
import {
  sendOTP,
  verifyOTP,
  checkAuth,
} from "@/src/services/otp-auth-client.service";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

type AuthStep = "login" | "otp";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          const redirect = searchParams.get("redirect") || "/dashboard";
          router.push(redirect);
          return;
        }
      } catch {
        // Not authenticated, continue with login flow
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkExistingAuth();
  }, [router, searchParams]);

  // Initialize redirect URL from search params on mount
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  const handleLogin = async (emailValue: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if user already has a valid session cookie
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        // User already authenticated, redirect immediately without OTP
        const finalRedirectUrl = redirectUrl || "/dashboard";
        router.push(finalRedirectUrl);
        return;
      }
    } catch {
      // Not authenticated - this is normal, continue with OTP flow
    }

    // No valid session - send OTP to user's email
    try {
      await sendOTP(emailValue, false, password);
      setEmail(emailValue);
      setPassword(password); // Store password for resend
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP - this creates the session cookie with user data
      await verifyOTP(email, code);

      // Redirect to dashboard (session cookie is now set)
      const finalRedirectUrl = redirectUrl || "/dashboard";
      router.push(finalRedirectUrl);
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
      await sendOTP(email, false, password); // Use stored password
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
    const redirectParam = redirectUrl || "/dashboard";

    // Build full callback URL with redirect parameter
    const callbackUrl = `${appOrigin}/auth/callback?redirect=${encodeURIComponent(
      redirectParam
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
    // Build go back URL with redirect parameter if exists
    const goBackUrl = redirectUrl
      ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
      : "/auth/login";

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
            href: goBackUrl,
            linkText: "Go back",
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12">
      <LoginForm
        onSubmit={handleLogin}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isLoading}
        error={error}
        footerLink={{
          text: "Don't have an account?",
          href: "/auth/register",
          linkText: "Sign up",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
