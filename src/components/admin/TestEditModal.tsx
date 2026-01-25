"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";

interface Test {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TestEditModalProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (testId: string, updates: Partial<Test>) => Promise<void>;
}

/**
 * Test Edit Modal Component
 * Modal for editing test information (title, description, isActive)
 */
export function TestEditModal({
  test,
  isOpen,
  onClose,
  onUpdate,
}: TestEditModalProps) {
  const [formData, setFormData] = useState<Partial<Test>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title || "",
        description: test.description || "",
        isActive: test.isActive ?? true,
      });
      setError("");
    }
  }, [test]);

  if (!test) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      await onUpdate(test.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update test");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
          <DialogDescription>
            Update test information and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter test title..."
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter test description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <Label htmlFor="isActive" className="text-base font-medium">
                Test Status
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {formData.isActive
                  ? "Test is active and visible to students"
                  : "Test is inactive and hidden from students"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={isSaving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

