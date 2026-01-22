"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Loading } from "@/src/ui/loading";
import { UserEditModal } from "@/src/components/admin/UserEditModal";
import { Search, Edit, ChevronDown, ChevronUp } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
  isPremium?: boolean;
  hasUnlimitedTests?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasDetailedExplanations?: boolean;
  hasPrioritySupport?: boolean;
  hasMobileAppAccess?: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : [];
        console.log(`[Users Page] Fetched ${usersArray.length} users`);
        setUsers(usersArray);
        if (usersArray.length === 0) {
          setError("No users found in the database");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to fetch users (${response.status})`;
        console.error(`[Users Page] API error:`, errorMessage);
        setError(errorMessage);
        setUsers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
      console.error(`[Users Page] Fetch error:`, err);
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, updates: Partial<User>) {
    try {
      // Send all updates in a single request (features + name/email/role)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to update user"
        );
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, ...updates } : user
        )
      );

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, ...updates });
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      throw err;
    }
  }

  const handleUserClick = (user: User) => {
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

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query)
    );
  });

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

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
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
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            {searchQuery
              ? "No users found matching your search"
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
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
                {filteredUsers.map((user) => {
                  const isExpanded = expandedRows.has(user.id);
                  const features = [
                    { key: "isPremium", label: "Premium" },
                    { key: "hasUnlimitedTests", label: "Unlimited Tests" },
                    { key: "hasAdvancedAnalytics", label: "Advanced Analytics" },
                    { key: "hasDetailedExplanations", label: "Detailed Explanations" },
                    { key: "hasPrioritySupport", label: "Priority Support" },
                    { key: "hasMobileAppAccess", label: "Mobile App Access" },
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
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isPremium ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-700">
                              Premium
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {features.length} active
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
                                    <span className="text-gray-500">Email:</span>{" "}
                                    <span className="text-gray-900">
                                      {user.email}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Name:</span>{" "}
                                    <span className="text-gray-900">
                                      {user.name || "Not set"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Role:</span>{" "}
                                    <span className="text-gray-900">
                                      {user.role || "STUDENT"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">
                                      Joined:
                                    </span>{" "}
                                    <span className="text-gray-900">
                                      {user.createdAt
                                        ? new Date(
                                            user.createdAt
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

      {/* User Edit Modal */}
      <UserEditModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={updateUser}
      />
    </div>
  );
}
