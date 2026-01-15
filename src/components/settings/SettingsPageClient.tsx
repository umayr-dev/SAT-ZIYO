"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/src/components/dashboard/SidebarContext";
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
  ArrowRight,
  Edit,
  Mail,
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
  const { isCollapsed } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const logoutMutation = useLogout();

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
      await authService.updateProfile({ name: tempName });
      setUser({ ...user, name: tempName });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    try {
      await authService.updateProfile({ email: tempEmail });
      setUser({ ...user, email: tempEmail });
      setIsEditingEmail(false);
    } catch (error) {
      console.error("Failed to update email:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gray-50 ">
      <DashboardSidebar />

      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="flex justify-center px-4 py-4">
          <div className="w-full max-w-2xl">
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
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        You don&apos;t have an active subscription.
                      </p>
                      <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
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
      </div>
    </div>
  );
}
