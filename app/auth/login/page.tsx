"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/src/components/auth/login-form";
import { OtpForm } from "@/src/components/auth/otp-form";
import { authService } from "@/src/services/auth.service";

type AuthStep = "login" | "otp";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Login with email and password
      await authService.login({
        email: emailValue,
        password,
      });
      setEmail(emailValue);
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP and get JWT token (token is stored in localStorage)
      await authService.verifyOtp(email, code);

      // Use window.location.href for hard redirect to ensure token is available
      // This prevents AuthGuard from redirecting back to login
      const finalRedirectUrl = redirectUrl || "/dashboard";
      window.location.href = finalRedirectUrl;
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
    try {
      // Re-login to resend OTP (password not needed for resend)
      await authService.login({
        email,
        password: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend OTP. Please try again."
      );
      throw err;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign in with Google. Please try again."
      );
    }
  };

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
