"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";
import { Save, User, Mail, Shield } from "lucide-react";

interface ProfileFormProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
}

export function ProfileForm({ user, onUserUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: user.email,
    name: user.name || "",
  });

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ email: user.email, name: user.name || "" });
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate email
      if (!formData.email || !formData.email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      // Update profile via API
      const updatedUser = await authService.updateProfile({
        email: formData.email,
        name: formData.name || undefined,
      });

      onUserUpdate(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account information and details
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* User ID (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input id="id" value={user.id} disabled className="bg-gray-50" />
          </div>

          {/* Name (Editable) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Editable) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Input
              id="role"
              value={user.role}
              disabled
              className="bg-gray-50 capitalize"
            />
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
