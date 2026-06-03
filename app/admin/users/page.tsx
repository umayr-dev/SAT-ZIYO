"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Loading } from "@/src/ui/loading";
import { UserEditModal } from "@/src/components/admin/UserEditModal";
import {
  Search,
  Edit,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";
import { Label } from "@/src/ui/label";
import { TablePagination } from "@/src/components/admin/TablePagination";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  targetScore?: number;
  examDate?: string | null;
  isPremium?: boolean;
  plan?: "free" | "premium" | string;
  subscription?: {
    id?: string;
    status?: string;
    startedAt?: string;
    expiresAt?: string;
  } | null;
  _count?: {
    attempts?: number;
  };
  hasUnlimitedTests?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasDetailedExplanations?: boolean;
  hasPrioritySupport?: boolean;
  hasMobileAppAccess?: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [backendMeta, setBackendMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "email">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const USERS_PER_PAGE = 10;
  const normalizedSearch = searchQuery.trim();
  const hasHydratedRef = useRef(false);
  const initialNormalizedSearchRef = useRef(normalizedSearch);
  const initialRoleFilterRef = useRef(roleFilter);

  const pageFromUrl = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? Number(raw) : 1;
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.floor(n));
  }, [searchParams]);

  const setPageAndUrl = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.floor(page));
      setCurrentPage(safePage);
      router.replace(`?page=${safePage}`);
    },
    [router],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(USERS_PER_PAGE),
        sortBy:
          sortBy === "date"
            ? "createdAt"
            : sortBy === "name"
              ? "name"
              : "email",
        sortOrder,
      });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (normalizedSearch) params.set("search", normalizedSearch);
      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data?.data) ? data.data : [];
        console.log(
          `[Users Page] Fetched ${usersArray.length} users (page ${data?.meta?.page ?? page})`,
        );
        setUsers(usersArray);
        setBackendMeta(
          data?.meta ?? {
            total: usersArray.length,
            page,
            limit: USERS_PER_PAGE,
            totalPages: 1,
          },
        );
        if (usersArray.length === 0 && !normalizedSearch && roleFilter === "all") {
          setError("No users found in the database");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `Failed to fetch users (${response.status})`;
        console.error(`[Users Page] API error:`, errorMessage);
        setError(errorMessage);
        setUsers([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      console.error(`[Users Page] Fetch error:`, err);
      setError(errorMessage);
      setUsers([]);
      setBackendMeta(null);
    } finally {
      setLoading(false);
    }
  }, [USERS_PER_PAGE, sortBy, sortOrder, roleFilter, normalizedSearch]);

  useEffect(() => {
    if (!mounted || !hasHydratedRef.current) return;
    const timeout = setTimeout(() => {
      fetchUsers(currentPage);
    }, 300);
    return () => clearTimeout(timeout);
  }, [mounted, currentPage, fetchUsers]);

  // URL'dagi `?page=` qiymatini state'ga sync qilamiz.
  // Muhim: bu yerda router.replace qilmaymiz, aks holda pagination click → URL o'zgarishi → yana setPageAndUrl → sikl bo'lib qoladi.
  useEffect(() => {
    if (!hasHydratedRef.current) {
      setCurrentPage(pageFromUrl);
      hasHydratedRef.current = true;
      return;
    }
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
  }, [pageFromUrl]);

  // Filter/search o'zgarganda har doim 1-betga qaytamiz.
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    // Mount/Reload paytida initial qiymatlar o'zgarmagan bo'lsa, page'ni 1 ga majburlamaymiz.
    if (
      normalizedSearch === initialNormalizedSearchRef.current &&
      roleFilter === initialRoleFilterRef.current
    ) {
      return;
    }
    setPageAndUrl(1);
  }, [normalizedSearch, roleFilter, setPageAndUrl]);

  async function updateUser(
    userId: string,
    updates: Partial<User> & { password?: string },
  ) {
    try {
      // Premium flagni PATCH orqali yubormaymiz – subscription API alohida ishlaydi
      const { isPremium, ...rest } = updates;

      // Agar faqat isPremium kelsa – bu faqat lokal state yangilash (backendga so‘rov yo‘q)
      const hasOtherFields = Object.keys(rest).length > 0;

      if (hasOtherFields) {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(rest),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || errorData.error || "Failed to update user",
          );
        }

        const responseData = await response.json().catch(() => ({}));

        const updatedUserData: Partial<User> & { password?: string } = {
          ...rest,
          ...(responseData.user || responseData),
        };

        // Parol UI stateida saqlanmasin
        if ("password" in updatedUserData) {
          delete (updatedUserData as any).password;
        }

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, ...updatedUserData } : user,
          ),
        );

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, ...updatedUserData });
        }
      }

      // Premium lokali – agar kelsa, faqat React state yangilanadi
      if (typeof isPremium === "boolean") {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, isPremium } : user,
          ),
        );
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, isPremium });
        }
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      throw err;
    }
  }

  const handleUserClick = (user: User) => {
    // Prevent owner from editing another owner
    if (
      currentUser?.role === "OWNER" &&
      user.role?.toUpperCase() === "OWNER" &&
      currentUser.id !== user.id
    ) {
      setError("Owners cannot edit other owners");
      return;
    }
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const toggleRowExpand = (userId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const totalPages = Math.max(1, backendMeta?.totalPages ?? 1);
  const paginatedUsers = users;

  // Get unique roles from database
  const availableRoles = Array.from(
    new Set(
      ["STUDENT", "ADMIN", "OWNER", ...users.map((user) => user.role || "")].filter(
        (role): role is string => !!role,
      ),
    ),
  ).sort();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "OWNER":
        return "bg-red-100 text-red-700";
      case "STUDENT":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Users</h2>
          <p className="text-gray-600">Manage user accounts and features</p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        {/* Brauzer autofill'ini o‘chirish uchun alohida form */}
        <form
          className="flex items-center gap-3"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              name="admin-user-search-query"
              id="admin-user-search-query"
              className="w-full pl-10"
            />
          </div>

          {/* Filter Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {(roleFilter !== "all" ||
              sortBy !== "name" ||
              sortOrder !== "asc") && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {(roleFilter !== "all" ? 1 : 0) +
                  (sortBy !== "name" ? 1 : 0) +
                  (sortOrder !== "asc" ? 1 : 0)}
              </span>
            )}
          </Button>
        </form>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      ) : (
        <>
          {paginatedUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">
                {normalizedSearch || roleFilter !== "all"
                  ? "No users found for selected filters"
                  : "No users found"}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => {
                      const isExpanded = expandedRows.has(user.id);
                      const features = [
                        { key: "isPremium", label: "Premium" },
                        { key: "hasUnlimitedTests", label: "Unlimited Tests" },
                        {
                          key: "hasAdvancedAnalytics",
                          label: "Advanced Analytics",
                        },
                        {
                          key: "hasDetailedExplanations",
                          label: "Detailed Explanations",
                        },
                        {
                          key: "hasPrioritySupport",
                          label: "Priority Support",
                        },
                        {
                          key: "hasMobileAppAccess",
                          label: "Mobile App Access",
                        },
                      ].filter((f) => user[f.key as keyof User]);

                      return (
                        <>
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleRowExpand(user.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name || "No name"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.role && (
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                                    user.role,
                                  )}`}
                                >
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  (user.plan ||
                                    (user.isPremium ? "premium" : "free")
                                  ).toLowerCase() === "premium"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {(
                                  user.plan || (user.isPremium ? "premium" : "free")
                                ).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.subscription?.status || "NONE"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserClick(user);
                                  }}
                                  disabled={
                                    currentUser?.role === "OWNER" &&
                                    user.role?.toUpperCase() === "OWNER" &&
                                    currentUser.id !== user.id
                                  }
                                  title={
                                    currentUser?.role === "OWNER" &&
                                    user.role?.toUpperCase() === "OWNER" &&
                                    currentUser.id !== user.id
                                      ? "Owners cannot edit other owners"
                                      : "Edit user"
                                  }
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpand(user.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                      User Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-500">
                                          Email:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.email}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Name:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.name || "Not set"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Role:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.role || "STUDENT"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Plan:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {(
                                            user.plan ||
                                            (user.isPremium ? "premium" : "free")
                                          ).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Subscription:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.subscription?.status || "NONE"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Expires:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.subscription?.expiresAt
                                            ? new Date(
                                                user.subscription.expiresAt,
                                              ).toLocaleString()
                                            : "N/A"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Attempts:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user._count?.attempts ?? 0}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Joined:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {user.createdAt
                                            ? new Date(
                                                user.createdAt,
                                              ).toLocaleString()
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {features.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                        Active Features
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {features.map((feature) => (
                                          <span
                                            key={feature.key}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                                          >
                                            {feature.label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {totalPages > 1 && (
            <Card className="p-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPageAndUrl}
                loading={loading}
                activeTone="orange"
              />
            </Card>
          )}
        </>
      )}

      {/* Filter Modal */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter & Sort Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role-filter">Role</Label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Roles</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "date" | "email")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort-order">Order</Label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="asc">A-Z / Oldest</option>
                <option value="desc">Z-A / Newest</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setRoleFilter("all");
                setSortBy("name");
                setSortOrder("asc");
                setSearchQuery("");
                    setPageAndUrl(1);
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setIsFilterModalOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Modal */}
      <UserEditModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={updateUser}
        availableRoles={availableRoles}
        canEditPlan={currentUser?.role?.toUpperCase() === "OWNER"}
      />
    </div>
  );
}
