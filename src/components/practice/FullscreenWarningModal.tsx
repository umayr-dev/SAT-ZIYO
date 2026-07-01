"use client";

import { memo } from "react";
import { Button } from "@/src/ui/button";

export interface FullscreenWarningModalProps {
  reason: "initial" | "exited";
  countdown: number;
  onEnterFullscreen: () => void;
  onContinueWithoutFullscreen: () => void;
}

export const FullscreenWarningModal = memo(function FullscreenWarningModal({
  reason,
  countdown,
  onEnterFullscreen,
  onContinueWithoutFullscreen,
}: FullscreenWarningModalProps) {
  const isExited = reason === "exited";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isExited ? "Fullscreen exited" : "How do you want to take the test?"}
        </h2>
        {countdown > 0 && (
          <p className="text-xs text-gray-500">
            {isExited
              ? `${countdown} sec to return to fullscreen — or your progress will be saved.`
              : "Choose an option below."}
          </p>
        )}
        {countdown === 0 && (
          <p className="text-xs text-amber-600 font-medium">
            Saving your progress…
          </p>
        )}
        <div className="space-y-2">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
            onClick={onEnterFullscreen}
            disabled={countdown === 0}
            size="sm"
          >
            Use fullscreen
          </Button>
          <Button
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm"
            onClick={onContinueWithoutFullscreen}
            disabled={countdown === 0}
            size="sm"
            variant="outline"
          >
            Continue with small screen
          </Button>
        </div>
      </div>
    </div>
  );
});
