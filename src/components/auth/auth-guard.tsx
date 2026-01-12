"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenStorage } from "@/src/lib/token-storage";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side Authentication Guard
 * Redirects to login if JWT token is missing
 *
 * Note: JWT tokens are stored in localStorage (client-side only)
 * Server-side can't access localStorage, so this guard runs on client
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = tokenStorage.getToken();
    if (!token) {
      // No token - redirect to login with current path as redirect URL
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?redirect=${redirectUrl}`);
    }
  }, [mounted, router, pathname]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Check token after mount
  const token = tokenStorage.getToken();
  if (!token) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
