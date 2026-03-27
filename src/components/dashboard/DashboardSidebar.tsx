"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BookText,
  Headphones,
  Menu,
  X,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { useSidebar } from "./SidebarContext";
import { useEffect, useMemo, useState } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: "emerald" | "blue" | "amber";
  /** Tashqi sayt (masalan Classroom) */
  external?: boolean;
}

// Only show actually available sections; hide "not allowed"/coming-soon items
const menuItems: MenuItem[] = [
  {
    label: "Home",
    icon: <Home className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    label: "Practice",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/dashboard/practice",
  },
  {
    label: "Classroom",
    icon: <BookText className="h-5 w-5" />,
    href: "https://my-math-academy.com/classroom/",
    external: true,
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    label: "Support",
    icon: <Headphones className="h-5 w-5" />,
    href: "/support",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(true);
  const [monthlyCompleted, setMonthlyCompleted] = useState(0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const FREE_MONTHLY_LIMIT = 8;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadLimitState() {
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
            const rawDate = a?.completedAt ?? a?.completed_at ?? a?.startedAt ?? a?.started_at;
            if (!rawDate) return false;
            const d = new Date(rawDate);
            return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year;
          }).length;
        }

        if (!cancelled) {
          setIsSubscriptionActive(active);
          setSubscriptionEndDate(endDate);
          setMonthlyCompleted(completedThisMonth);
          const paymentStarted =
            typeof window !== "undefined" &&
            sessionStorage.getItem("payme_payment_started") === "1";
          if (paymentStarted && active) {
            setShowCongrats(true);
            sessionStorage.removeItem("payme_payment_started");
            window.setTimeout(() => {
              setShowCongrats(false);
            }, 4500);
          }
        }
      } catch {
        if (!cancelled) {
          setIsSubscriptionActive(false);
          setSubscriptionEndDate(null);
          setMonthlyCompleted(0);
        }
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    }
    loadLimitState();
    return () => {
      cancelled = true;
    };
  }, []);

  const freeRemaining = Math.max(0, FREE_MONTHLY_LIMIT - monthlyCompleted);
  const isExpired =
    !isSubscriptionActive &&
    !!subscriptionEndDate &&
    subscriptionEndDate.getTime() <= Date.now();
  const statusLabel = useMemo(() => {
    if (billingLoading) return "Checking...";
    if (isSubscriptionActive) return "Premium active";
    if (isExpired) return "Expired";
    if (freeRemaining <= 0) return "Limit reached";
    return "Free plan";
  }, [billingLoading, isSubscriptionActive, isExpired, freeRemaining]);
  const planLabel = isSubscriptionActive ? "Premium" : "Free";
  const formattedEndDate =
    subscriptionEndDate && !Number.isNaN(subscriptionEndDate.getTime())
      ? subscriptionEndDate.toLocaleDateString()
      : null;

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

  return (
    <>
      {showCongrats && (
        <div className="fixed top-4 right-4 z-[90] animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg px-4 py-3 flex items-start gap-2 max-w-xs">
            <Sparkles className="h-4 w-4 mt-0.5 text-emerald-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold">Congratulations!</p>
              <p className="text-xs mt-0.5">
                Premium activated successfully. Enjoy all features.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white text-brand-blue shadow-lg hover:shadow-xl border border-brand-blue-light transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-brand-blue-light h-screen fixed left-0 top-0 flex flex-col overflow-hidden transition-all duration-300 z-40 shadow-sm",
          isCollapsed ? "w-20" : "w-72",
          "lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "border-b border-brand-blue-light flex-shrink-0 relative bg-white",
            isCollapsed ? "p-4 pb-3" : "p-6 pr-16",
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center flex-shrink-0"
              >
                <div className="relative bg-white p-2 rounded-xl border border-brand-blue-light shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="SAT Ziyo Logo"
                    width={40}
                    height={40}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-brand-blue leading-tight">
                  SAT Ziyo
                </span>
                <span className="text-xs text-brand-blue/80 leading-tight">
                  Digital SAT Prep
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center"
              >
                <div className="relative bg-white p-2 rounded-xl border border-brand-blue-light shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="SAT Ziyo Logo"
                    width={40}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl bg-brand-blue-50 hover:bg-brand-blue-light border border-brand-blue-light transition-all duration-200 flex items-center justify-center"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4 text-brand-blue" />
              </Button>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-3 w-9 h-9 rounded-xl bg-brand-blue-50 hover:bg-brand-blue-light border border-brand-blue-light transition-all duration-200 flex items-center justify-center"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <X className="h-4 w-4 text-brand-blue" />
            </Button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Menu */}
          <div className={cn("p-4", isCollapsed && "px-2")}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-brand-blue/70 uppercase tracking-wider mb-4 px-2">
                Navigation
              </h3>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = !item.external && pathname === item.href;
                const linkClassName = cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative border-r-0 after:content-none after:!hidden",
                  isCollapsed
                    ? "justify-center px-2 py-3"
                    : "justify-between px-4 py-3",
                  isActive
                    ? "bg-brand-blue text-white shadow-md"
                    : "text-brand-blue hover:bg-brand-blue-50 hover:text-brand-blue",
                );
                const inner = (
                  <>
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-white"
                            : "text-brand-blue/70 group-hover:text-brand-blue",
                        )}
                      >
                        {item.icon}
                      </div>
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-semibold relative z-10",
                          item.badgeColor === "emerald"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.badgeColor === "blue"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                          item.badgeColor === "emerald"
                            ? "bg-emerald-500"
                            : item.badgeColor === "blue"
                              ? "bg-blue-500"
                              : "bg-amber-500",
                        )}
                      />
                    )}
                  </>
                );
                return (
                  <div
                    key={item.href}
                    className="relative group/item [&>*]:after:!content-none [&>*]:after:!hidden"
                  >
                    {item.external ? (
                      <a
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={linkClassName}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={linkClassName}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {inner}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Account Limit / Subscription Card */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <Card className="overflow-hidden relative shadow-sm border border-brand-blue/20 bg-white">
                <CardContent className="p-0">
                  <div className="px-4 py-3 bg-gradient-to-r from-brand-blue/10 to-indigo-100/70 border-b border-brand-blue/15">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-blue rounded-lg shadow-sm">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-blue leading-tight">
                          {isSubscriptionActive ? "Premium Plan" : "Account Limit"}
                        </p>
                        <p className="text-[11px] text-brand-blue/70 leading-tight">
                          {isSubscriptionActive
                            ? "Full access enabled"
                            : "Monthly free test usage"}
                        </p>
                      </div>
                      <span className="ml-auto text-[11px] px-2.5 py-1 bg-white text-brand-blue rounded-full font-semibold border border-brand-blue/20">
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {!isSubscriptionActive ? (
                      <>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-brand-blue/70 font-semibold">
                              Used this month
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold text-brand-blue">
                                {billingLoading
                                  ? "…"
                                  : Math.min(monthlyCompleted, FREE_MONTHLY_LIMIT)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-brand-blue/50" />
                              <span className="text-xl font-semibold text-brand-blue/70">
                                {FREE_MONTHLY_LIMIT}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
                            Free
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-brand-blue/10 overflow-hidden">
                          <div
                            className="h-full bg-brand-blue transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                (Math.min(monthlyCompleted, FREE_MONTHLY_LIMIT) /
                                  FREE_MONTHLY_LIMIT) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="text-xs text-brand-blue/80">
                          {freeRemaining} free tests left this month
                        </p>
                      </>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-800">
                          Premium is active
                        </p>
                        {formattedEndDate && (
                          <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Valid until {formattedEndDate}
                          </p>
                        )}
                      </div>
                    )}

                    {!isSubscriptionActive && isExpired && (
                      <div className="text-[11px] text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Subscription expired. Premium features are restricted.
                      </div>
                    )}

                    <Link
                      href="/settings"
                      className="inline-flex text-[11px] font-medium text-brand-blue hover:underline"
                    >
                      Manage subscription
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Secondary CTA button */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              {isSubscriptionActive ? (
                <Link href="/settings">
                  <Button className="w-full bg-brand-blue text-white font-semibold rounded-xl hover:bg-brand-blue/90 shadow-sm h-10">
                    Manage plan
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleStartPayment}
                  className="w-full bg-brand-blue text-white font-semibold rounded-xl hover:bg-brand-blue/90 shadow-sm h-10"
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 border-t border-brand-blue-light bg-white">
          {/* Bottom Menu */}
          <div className={cn("px-4 pt-3 pb-3", isCollapsed && "px-2")}>
            <nav className="space-y-1">
              {bottomMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    className="relative group/item [&>*]:after:!content-none [&>*]:after:!hidden"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative border-r-0 after:content-none after:!hidden",
                        isCollapsed
                          ? "justify-center px-2 py-3"
                          : "gap-3 px-4 py-3",
                        isActive
                          ? "bg-brand-blue text-white shadow-md"
                          : item.label === "Support"
                            ? "text-black hover:bg-brand-blue-50"
                            : "text-brand-blue hover:bg-brand-blue-50 hover:text-brand-blue",
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-white"
                            : item.label === "Support"
                              ? "text-black group-hover:text-black"
                              : "text-brand-blue/70 group-hover:text-brand-blue",
                        )}
                      >
                        {item.icon}
                      </div>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Spacer for collapsed sidebar */}
      <div
        className={cn(
          "hidden lg:block transition-all duration-300",
          isCollapsed ? "w-20" : "w-72",
        )}
      />
    </>
  );
}
