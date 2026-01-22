"use client";

import { useState } from "react";

interface UserFeatureToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

/**
 * User Feature Toggle Component
 * Switch component for enabling/disabling user features
 */
export function UserFeatureToggle({
  label,
  description,
  enabled,
  onToggle,
}: UserFeatureToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(!enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          enabled ? "bg-orange-500" : "bg-gray-300"
        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}


