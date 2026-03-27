"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/src/components/dashboard/SidebarContext";
import { ProfileForm } from "@/src/components/profile/ProfileForm";
import { authService } from "@/src/services/auth.service";
import { useLogout } from "@/src/hooks/use-auth";
import type { UserProfile } from "@/src/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Calendar, CreditCard, LogOut } from "lucide-react";

export function ProfilePageClient() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      logoutMutation.mutateAsync().catch(() => {});
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // If error, redirect to login
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubscriptionState() {
      try {
        setBillingLoading(true);
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) return;
        const meRaw = (await meRes.json()) as Record<string, unknown>;
        const me = ((
          meRaw?.data as Record<string, unknown> | undefined
        )?.user ??
          (meRaw?.data as Record<string, unknown> | undefined) ??
          (meRaw?.user as Record<string, unknown> | undefined) ??
          meRaw) as Record<string, unknown>;
        const subscriptionsArr = Array.isArray(me.subscriptions)
          ? (me.subscriptions as Array<Record<string, unknown>>)
          : [];
        const subscriptionObj =
          ((me.subscription as Record<string, unknown> | null) ??
            subscriptionsArr.find(
              (s) => String(s?.status ?? "").toUpperCase() === "ACTIVE",
            ) ??
            subscriptionsArr[0] ??
            null) as
            | { status?: string; expiresAt?: string; expires_at?: string }
            | null;
        const status = (
          me.subscriptionStatus ??
          me.subscription_status ??
          subscriptionObj?.status
        ) as
          | string
          | undefined;
        const plan = (me.plan ?? me.subscriptionPlan ?? me.planType) as
          | string
          | undefined;
        const premiumFlag = (me.isPremium ?? me.premium ?? me.hasPremiumAccess) as
          | boolean
          | undefined;
        const rawEnd =
          (me.subscriptionEndsAt ??
            me.subscription_end_at ??
            me.subscriptionEndDate ??
            me.subscription_expires_at ??
            me.premiumExpiresAt ??
            me.premium_expires_at ??
            subscriptionObj?.expiresAt ??
            subscriptionObj?.expires_at) as string | undefined;

        let endDate: Date | null = null;
        if (rawEnd) {
          const parsed = new Date(rawEnd);
          if (!Number.isNaN(parsed.getTime())) endDate = parsed;
        }
        const activeByStatus =
          typeof status === "string" && status.toUpperCase() === "ACTIVE";
        const activeByPlan =
          typeof plan === "string" && plan.toUpperCase() === "PREMIUM";
        const activeByDate = !!endDate && endDate.getTime() > Date.now();
        const active = Boolean(
          premiumFlag || activeByStatus || activeByPlan || activeByDate,
        );

        if (!cancelled) {
          setIsSubscriptionActive(active);
          setSubscriptionEndDate(endDate);
        }
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    }
    loadSubscriptionState();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartPayment = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("payme_payment_started", "1");
      }
      const res = await fetch("/api/payme/create-subscription", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.redirectUrl) {
        alert(data?.message || "Could not start payment");
        return;
      }
      window.location.href = data.redirectUrl as string;
    } catch {
      alert("Payment initialization failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white ">
      {/* Sidebar - Client Component for navigation */}
      <DashboardSidebar />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="pl-2 pr-6 py-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Form */}
          <ProfileForm user={user} onUserUpdate={setUser} />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-blue">
                <CreditCard className="h-4 w-4" />
                Subscription
              </CardTitle>
              <CardDescription>
                View your current plan and manage premium access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-700">
                Plan:{" "}
                <span className="font-semibold">
                  {billingLoading ? "Checking..." : isSubscriptionActive ? "Premium" : "Free"}
                </span>
              </div>
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                {subscriptionEndDate
                  ? `Valid until ${subscriptionEndDate.toLocaleDateString()}`
                  : "No active subscription end date"}
              </div>
              <div className="pt-1">
                <Button
                  onClick={handleStartPayment}
                  className="bg-brand-blue text-white hover:bg-brand-blue/90"
                >
                  {isSubscriptionActive ? "Renew Premium" : "Upgrade to Premium"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <LogOut className="h-4 w-4" />
                Sign Out
              </CardTitle>
              <CardDescription>
                Sign out of your account on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
