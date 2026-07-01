"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function formatTimer(seconds: number | null): string {
  if (seconds === null) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

interface ModuleWallClockTimerProps {
  moduleDeadline: number | null;
  onTimeUp: () => void;
  onRemainingSecondsChange?: (remaining: number) => void;
  isHidden?: boolean;
  onHide?: () => void;
  onShow?: () => void;
}

/**
 * Isolated module timer derived from a wall-clock deadline.
 * Single interval — renders mobile + desktop displays without re-rendering the parent.
 */
export const ModuleWallClockTimer = memo(function ModuleWallClockTimer({
  moduleDeadline,
  onTimeUp,
  onRemainingSecondsChange,
  isHidden = false,
  onHide,
  onShow,
}: ModuleWallClockTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const onRemainingRef = useRef(onRemainingSecondsChange);
  const timeUpFiredRef = useRef(false);

  onTimeUpRef.current = onTimeUp;
  onRemainingRef.current = onRemainingSecondsChange;

  useEffect(() => {
    if (moduleDeadline === null) {
      setRemainingSeconds(null);
      onRemainingRef.current?.(0);
      return;
    }

    timeUpFiredRef.current = false;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((moduleDeadline - Date.now()) / 1000),
      );
      setRemainingSeconds(remaining);
      onRemainingRef.current?.(remaining);

      if (remaining <= 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        onTimeUpRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [moduleDeadline]);

  const cannotHide =
    remainingSeconds !== null && remainingSeconds <= 300;

  return (
    <>
      {/* Mobile */}
      <div className="flex items-center gap-1 ml-2 min-[480px]:hidden">
        <div className="text-xs font-bold text-black">
          {formatTimer(remainingSeconds)}
        </div>
      </div>

      {/* Desktop */}
      {isHidden ? (
        <div className="hidden min-[480px]:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={onShow}
            className="flex items-center justify-center text-gray-600 hover:text-blue-600 focus:outline-none rounded p-1"
            aria-label="Show timer"
            title="Show timer"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="hidden min-[480px]:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2">
          <div className="text-base sm:text-lg font-bold text-black">
            {formatTimer(remainingSeconds)}
          </div>
          <button
            type="button"
            onClick={() => {
              if (cannotHide) return;
              onHide?.();
            }}
            disabled={cannotHide}
            className="flex items-center justify-center text-xs text-gray-600 hover:text-blue-600 focus:outline-none rounded-md p-1 transition-colors duration-200"
            aria-label="Hide timer"
            title="Hide timer"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
});
