"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/src/components/auth/auth-form";
import { useRegister } from "@/src/hooks/use-auth";
import { authService } from "@/src/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();

  const handleSubmit = async (email: string, password: string) => {
    try {
      // Note: confirmPassword is validated in AuthForm component
      // We only send email and password to the API
      await registerMutation.mutateAsync({
        email,
        password,
        confirmPassword: password, // This is validated in form, not sent to API
      });
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
      console.error("Registration failed:", error);
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
        title="Create Account"
        description="Enter your information to create a new account"
        submitLabel="Sign Up"
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={registerMutation.isPending}
        error={
          registerMutation.error
            ? registerMutation.error instanceof Error
              ? registerMutation.error.message
              : typeof registerMutation.error === "object" &&
                registerMutation.error !== null &&
                "message" in registerMutation.error
              ? String((registerMutation.error as { message: unknown }).message)
              : "An error occurred"
            : null
        }
        showConfirmPassword={true}
        footerLink={{
          text: "Already have an account?",
          href: "/auth/login",
          linkText: "Sign in",
        }}
      />
    </div>
  );
}
