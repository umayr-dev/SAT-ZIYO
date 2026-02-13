"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { UserFeatureToggle } from "./UserFeatureToggle";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
  targetScore?: number;
  examDate?: string | null;
  isPremium?: boolean;
  hasUnlimitedTests?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasDetailedExplanations?: boolean;
  hasPrioritySupport?: boolean;
  hasMobileAppAccess?: boolean;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    userId: string,
    updates: Partial<User> & { password?: string },
  ) => Promise<void>;
  availableRoles?: string[]; // Roles from database
}

/**
 * User Edit Modal Component
 * Modal for editing user information and features
 */
export function UserEditModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  availableRoles = [],
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [targetScoreInput, setTargetScoreInput] = useState("");
  const [examDateInput, setExamDateInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        isPremium: user.isPremium || false,
      });
      setPassword("");
      setTargetScoreInput(
        typeof user.targetScore === "number" ? String(user.targetScore) : "",
      );
      setExamDateInput(
        user.examDate ? user.examDate.slice(0, 10) : "",
      );
      setError("");
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !user) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      const updates: Partial<User> & { password?: string } = {};

      // Faqat ruxsat berilgan maydonlar: name, email, role, password, targetScore, examDate
      if (typeof formData.name === "string") {
        updates.name = formData.name;
      }
      if (typeof formData.email === "string") {
        updates.email = formData.email;
      }
      if (typeof formData.role === "string" && formData.role) {
        updates.role = formData.role;
      }

      // Parol faqat kiritilganda yuboriladi
      if (password.trim()) {
        updates.password = password.trim();
      }

      // Target score – bo‘sh bo‘lsa yubormaymiz
      if (targetScoreInput.trim()) {
        const n = Number(targetScoreInput.trim());
        if (!Number.isNaN(n)) {
          updates.targetScore = n;
        }
      }

      // Exam date – bo‘sh bo‘lsa:
      //  - avval bor bo‘lsa -> null (tozalash)
      //  - bo‘lmasa umuman yubormaymiz
      if (examDateInput === "") {
        if (user.examDate) {
          updates.examDate = null;
        }
      } else {
        updates.examDate = examDateInput;
      }

      await onUpdate(user.id, updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  // Faqat Premium Access – backendda subscription endpoint orqali boshqariladi
  const handlePremiumToggle = async (value: boolean) => {
    const previous = formData.isPremium || false;
    setFormData((prev) => ({ ...prev, isPremium: value }));
    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/subscription`,
        {
          method: value ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: value ? JSON.stringify({ days: 30 }) : undefined,
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || data.error || "Failed to update subscription",
        );
      }

      // Lokal user ro‘yxatini yangilash uchun faqat isPremium ni yuboramiz
      await onUpdate(user.id, { isPremium: value });
    } catch (err) {
      console.error("Failed to update feature:", err);
      setFormData((prev) => ({ ...prev, isPremium: previous }));
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update premium access",
      );
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select role</option>
                    {(() => {
                      // Always include STUDENT and ADMIN, plus any other roles from database (except OWNER)
                      const baseRoles = ["STUDENT", "ADMIN"];
                      const dbRoles = availableRoles
                        .filter((role) => role && role.toUpperCase() !== "OWNER")
                        .map((r) => r.toUpperCase());
                      
                      // Combine and deduplicate
                      const allRoles = Array.from(new Set([...baseRoles, ...dbRoles]));
                      
                      return allRoles.map((role) => {
                        const roleLabel =
                          role === "STUDENT"
                            ? "Student"
                            : role === "ADMIN"
                            ? "Admin"
                            : role === "TEACHER"
                            ? "Teacher"
                            : role;
                        return (
                          <option key={role} value={role}>
                            {roleLabel}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
                {user.createdAt && (
                  <div className="space-y-2">
                    <Label>Joined Date</Label>
                    <Input
                      value={new Date(user.createdAt).toLocaleDateString()}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetScore">Target SAT Score</Label>
                  <Input
                    id="targetScore"
                    type="number"
                    min={400}
                    max={1600}
                    placeholder="e.g. 1400"
                    value={targetScoreInput}
                    onChange={(e) => setTargetScoreInput(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examDate">Planned Exam Date</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={examDateInput}
                    onChange={(e) => setExamDateInput(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Feature Access
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserFeatureToggle
                  label="Premium Access"
                  description="Enable or disable premium access for this user"
                  enabled={formData.isPremium || false}
                  onToggle={handlePremiumToggle}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}


