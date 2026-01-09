"use client";

import { Card } from "@/src/ui/card";

/**
 * Admin Quick Actions - Client Component
 *
 * Performance: Dynamically imported to reduce initial bundle
 */
export default function AdminQuickActions() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <p className="font-medium text-gray-900">Manage Users</p>
          <p className="text-sm text-gray-500 mt-1">
            View and manage user accounts
          </p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <p className="font-medium text-gray-900">Add Questions</p>
          <p className="text-sm text-gray-500 mt-1">
            Create new practice questions
          </p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <p className="font-medium text-gray-900">View Analytics</p>
          <p className="text-sm text-gray-500 mt-1">
            Check platform statistics
          </p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <p className="font-medium text-gray-900">Settings</p>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform settings
          </p>
        </button>
      </div>
    </Card>
  );
}
