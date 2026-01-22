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
  onUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
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
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        isPremium: user.isPremium || false,
        hasUnlimitedTests: user.hasUnlimitedTests || false,
        hasAdvancedAnalytics: user.hasAdvancedAnalytics || false,
        hasDetailedExplanations: user.hasDetailedExplanations || false,
        hasPrioritySupport: user.hasPrioritySupport || false,
        hasMobileAppAccess: user.hasMobileAppAccess || false,
      });
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
      await onUpdate(user.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureToggle = async (feature: string, value: boolean) => {
    const updatedData = { ...formData, [feature]: value };
    setFormData(updatedData);
    try {
      await onUpdate(user.id, { [feature]: value });
    } catch (err) {
      console.error("Failed to update feature:", err);
      setFormData({ ...formData });
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
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
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
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Feature Access
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserFeatureToggle
                  label="Premium Access"
                  description="Full premium features access"
                  enabled={formData.isPremium || false}
                  onToggle={(value) => handleFeatureToggle("isPremium", value)}
                />
                <UserFeatureToggle
                  label="Unlimited Tests"
                  description="Access to unlimited test simulations"
                  enabled={formData.hasUnlimitedTests || false}
                  onToggle={(value) =>
                    handleFeatureToggle("hasUnlimitedTests", value)
                  }
                />
                <UserFeatureToggle
                  label="Advanced Analytics"
                  description="Detailed performance analytics"
                  enabled={formData.hasAdvancedAnalytics || false}
                  onToggle={(value) =>
                    handleFeatureToggle("hasAdvancedAnalytics", value)
                  }
                />
                <UserFeatureToggle
                  label="Detailed Explanations"
                  description="Detailed question explanations"
                  enabled={formData.hasDetailedExplanations || false}
                  onToggle={(value) =>
                    handleFeatureToggle("hasDetailedExplanations", value)
                  }
                />
                <UserFeatureToggle
                  label="Priority Support"
                  description="Priority customer support"
                  enabled={formData.hasPrioritySupport || false}
                  onToggle={(value) =>
                    handleFeatureToggle("hasPrioritySupport", value)
                  }
                />
                <UserFeatureToggle
                  label="Mobile App Access"
                  description="Access to mobile application"
                  enabled={formData.hasMobileAppAccess || false}
                  onToggle={(value) =>
                    handleFeatureToggle("hasMobileAppAccess", value)
                  }
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


