"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";

/**
 * Admin Quick Actions - Client Component
 *
 * Performance: Dynamically imported to reduce initial bundle
 */
export default function AdminQuickActions() {
  const router = useRouter();

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push("/admin/tests/create")}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <p className="font-medium text-gray-900">Create Test</p>
          <p className="text-sm text-gray-500 mt-1">
            Create a new practice test
          </p>
        </button>
        <button
          onClick={() => router.push("/admin/users")}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <p className="font-medium text-gray-900">Manage Users</p>
          <p className="text-sm text-gray-500 mt-1">
            View and manage user accounts
          </p>
        </button>
        <button
          onClick={() => router.push("/admin/tests")}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <p className="font-medium text-gray-900">Manage Tests</p>
          <p className="text-sm text-gray-500 mt-1">
            View and edit existing tests
          </p>
        </button>
        <button
          onClick={() => router.push("/admin/exam-dates")}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <p className="font-medium text-gray-900">Exam Dates</p>
          <p className="text-sm text-gray-500 mt-1">
            Add exam dates for dashboard select
          </p>
        </button>
        <button
          onClick={() => router.push("/admin/settings")}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <p className="font-medium text-gray-900">Settings</p>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform settings
          </p>
        </button>
      </div>
    </Card>
  );
}


