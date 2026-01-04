"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/src/components/auth/auth-form";
import { useLogin } from "@/src/hooks/use-auth";
import { authService } from "@/src/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
      console.error("Login failed:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
      // User will be redirected to Google OAuth, then back to callback
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12">
      <AuthForm
        title="Sign In"
        description="Enter your email and password to access your account"
        submitLabel="Sign In"
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={loginMutation.isPending}
        error={
          loginMutation.error
            ? loginMutation.error instanceof Error
              ? loginMutation.error.message
              : typeof loginMutation.error === "object" &&
                loginMutation.error !== null &&
                "message" in loginMutation.error
              ? String((loginMutation.error as { message: unknown }).message)
              : "An error occurred"
            : null
        }
        footerLink={{
          text: "Don't have an account?",
          href: "/auth/register",
          linkText: "Sign up",
        }}
      />
    </div>
  );
}
