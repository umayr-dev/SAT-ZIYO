"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { logout as otpLogout } from "@/src/services/otp-auth-client.service";
import { Button } from "@/src/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await otpLogout();
    } catch {
      // ignore errors
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="flex items-center space-x-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="SAT Ziyo Logo"
                    width={40}
                    height={40}
                    className="object-contain rounded-lg"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">SAT Ziyo Management</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}


