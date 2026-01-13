"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth } from "@/src/services/otp-auth-client.service";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side Authentication Guard
 * Redirects to login if session cookie is invalid or missing
 * Uses cookie-based authentication (HttpOnly cookies)
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const verifyAuth = async () => {
      try {
        const authenticated = await checkAuth();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          // No valid session - redirect to login with current path as redirect URL
          const redirectUrl = encodeURIComponent(pathname);
          router.push(`/auth/login?redirect=${redirectUrl}`);
        }
      } catch (error) {
        // Auth check failed - redirect to login
        setIsAuthenticated(false);
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?redirect=${redirectUrl}`);
      }
    };

    verifyAuth();
  }, [mounted, router, pathname]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect in useEffect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
