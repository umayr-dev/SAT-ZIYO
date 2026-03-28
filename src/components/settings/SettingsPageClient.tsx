"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/src/services/auth.service";
import { useLogout } from "@/src/hooks/use-auth";
import type { UserProfile } from "@/src/types";
import { cn } from "@/lib/utils";
import {
  Settings,
  User,
  Lock,
  CreditCard,
  Settings2,
  Shield,
  Check,
  LogOut,
  Edit,
  Mail,
  CalendarDays,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";

type SettingsTab = "profile" | "security" | "subscription" | "preferences";

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Settings2 },
];

export function SettingsPageClient() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [billingLoading, setBillingLoading] = useState(true);
  const [monthlyCompleted, setMonthlyCompleted] = useState(0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const logoutMutation = useLogout();
  const FREE_MONTHLY_LIMIT = 8;

  useEffect(() => {
    async function fetchUser() {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function loadBillingState() {
      try {
        setBillingLoading(true);
        const [meRes, attemptsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/practice/my-attempts", { credentials: "include" }),
        ]);

        let active = false;
        let endDate: Date | null = null;

        if (meRes.ok) {
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
          ) as string | undefined;
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

          if (rawEnd) {
            const parsed = new Date(rawEnd);
            if (!Number.isNaN(parsed.getTime())) endDate = parsed;
          }

          const statusActive =
            typeof status === "string" && status.toUpperCase() === "ACTIVE";
          const planActive =
            typeof plan === "string" && plan.toUpperCase() === "PREMIUM";
          const dateActive = !!endDate && endDate.getTime() > Date.now();
          active = Boolean(premiumFlag || statusActive || planActive || dateActive);
        }

        let completedThisMonth = 0;
        if (attemptsRes.ok) {
          const rawAttempts = await attemptsRes.json();
          const attempts = Array.isArray(rawAttempts)
            ? rawAttempts
            : Array.isArray(rawAttempts?.data)
              ? rawAttempts.data
              : Array.isArray(rawAttempts?.attempts)
                ? rawAttempts.attempts
                : [];
          const now = new Date();
          const month = now.getMonth();
          const year = now.getFullYear();
          completedThisMonth = attempts.filter((a: any) => {
            const status = String(a?.status ?? "").toUpperCase();
            if (status !== "COMPLETED") return false;
            const rawDate =
              a?.completedAt ?? a?.completed_at ?? a?.startedAt ?? a?.started_at;
            if (!rawDate) return false;
            const d = new Date(rawDate);
            return (
              !Number.isNaN(d.getTime()) &&
              d.getMonth() === month &&
              d.getFullYear() === year
            );
          }).length;
        }

        if (!cancelled) {
          setIsSubscriptionActive(active);
          setSubscriptionEndDate(endDate);
          setMonthlyCompleted(completedThisMonth);
        }
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    }

    loadBillingState();
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

  const handleLogout = async () => {
    try {
      // Start logout process but don't wait - redirect immediately
      logoutMutation.mutateAsync().catch(() => {
        // Silently handle errors
      });
      // Immediate redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API call fails, redirect to home page
      window.location.href = "/";
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateProfile({ name: tempName });
      setUser(updatedUser);
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  const handleSaveEmail = async () => {
    // Email PATCH /auth/profile orqali yangilanmaydi; faqat profil sahifasida ko‘rsatiladi
    if (!user) return;
      setIsEditingEmail(false);
    setTempEmail(user.email || "");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const freeRemaining = Math.max(0, FREE_MONTHLY_LIMIT - monthlyCompleted);
  const isExpired =
    !isSubscriptionActive &&
    !!subscriptionEndDate &&
    subscriptionEndDate.getTime() <= Date.now();
  const statusLabel = billingLoading
    ? "Checking..."
    : isSubscriptionActive
      ? "Premium active"
      : isExpired
        ? "Expired"
        : freeRemaining <= 0
          ? "Limit reached"
          : "Free plan";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-2xl py-4 sm:py-6">
            {/* User Profile Header */}
            <Card className="bg-blue-900 text-white border-0 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {initials}
                      </div>
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 bg-gray-700 rounded-full p-0.5">
                        <Settings className="h-2 w-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold mb-0.5">
                        {displayName}
                      </h2>
                      <p className="text-xs text-blue-200">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-200">
                    <Shield className="h-3.5 w-3.5" />
                    <Check className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      Secure & private
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 border border-gray-200">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-blue-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === "profile" && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base">Basic info</CardTitle>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Update your display name used across the app.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {!isEditingName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Name</p>
                            <p className="text-base font-semibold text-gray-900">
                              {displayName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingName(true);
                              setTempName(user.name || displayName);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit name
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Name</p>
                            <Input
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="max-w-md text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveName}
                              className="bg-blue-900 hover:bg-blue-800 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditingName(false);
                                setTempName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base">
                          Email address
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!isEditingEmail ? (
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-gray-900">
                            {user.email}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingEmail(true);
                              setTempEmail(user.email || "");
                            }}
                          >
                            Change email
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Email</p>
                            <Input
                              type="email"
                              value={tempEmail}
                              onChange={(e) => setTempEmail(e.target.value)}
                              className="max-w-md text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEmail}
                              className="bg-blue-900 hover:bg-blue-800 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditingEmail(false);
                                setTempEmail("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sign Out Card */}
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-red-600" />
                        <CardTitle className="text-base text-red-900">
                          Sign Out
                        </CardTitle>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Sign out of your account on this device.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {logoutMutation.isPending
                          ? "Signing out..."
                          : "Sign Out"}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "security" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-base">Password</CardTitle>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Choose a strong password to keep your account safe.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Input
                        type="password"
                        value="........"
                        readOnly
                        className="max-w-md"
                      />
                      <Button variant="outline" size="sm">
                        Change password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "subscription" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-base">Subscription</CardTitle>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Manage your subscription and billing.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-blue-900">Current plan</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-white border border-blue-200 text-blue-800 font-semibold">
                            {statusLabel}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-blue-900">
                          {isSubscriptionActive ? "Premium" : "Free"}
                        </div>
                        <div className="mt-1 text-xs text-blue-800 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {subscriptionEndDate
                            ? `Valid until ${subscriptionEndDate.toLocaleDateString()}`
                            : "No active subscription end date"}
                        </div>
                        {!isSubscriptionActive && (
                          <p className="mt-2 text-xs text-blue-800">
                            {freeRemaining} free tests left this month ({monthlyCompleted}/{FREE_MONTHLY_LIMIT} used)
                          </p>
                        )}
                        {!isSubscriptionActive && isExpired && (
                          <p className="mt-2 text-xs text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Subscription expired. Renew to restore full access.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleStartPayment}
                          className="bg-blue-900 hover:bg-blue-800 text-white"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isSubscriptionActive ? "Renew Premium" : "Upgrade to Premium"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/dashboard/practice")}
                        >
                          Go to Practice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "preferences" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-base">
                        Daily questions
                      </CardTitle>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Get practice questions delivered to your dashboard every
                      day.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1.5">
                          Currently disabled — toggle to receive curated
                          practice daily
                        </p>
                        <p className="text-xs text-gray-500">
                          Questions are randomly selected from both English and
                          Math sections across tests. You can complete them
                          anytime during the day.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
      </div>
    </div>
  );
}
