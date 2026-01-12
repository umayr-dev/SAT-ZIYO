"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/src/components/auth/register-form";
import { OtpForm } from "@/src/components/auth/otp-form";
import { authService } from "@/src/services/auth.service";

type AuthStep = "register" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("register");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (
    name: string,
    emailValue: string,
    password: string,
    confirmPassword: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Register with name, email and password
      await authService.register({
        name,
        email: emailValue,
        password,
        confirmPassword,
      });
      setEmail(emailValue);
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
      // Verify OTP and get JWT token (token is stored in localStorage)
      await authService.verifyOtp(email, code);

      // Use window.location.href for hard redirect to ensure token is available
      // This prevents AuthGuard from redirecting back to login
      window.location.href = "/dashboard";
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
      // Re-register to resend OTP (name and password not needed for resend)
      // Note: This might need to be a separate endpoint in the API
      await authService.register({
        name: "", // Not needed for resend
        email,
        password: "", // Not needed for resend
        confirmPassword: "",
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
