"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TestTimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
  onRemainingTimeChange?: (remainingSeconds: number) => void;
  isHidden?: boolean;
}

/**
 * Test Timer Component
 * Displays countdown timer with visual warnings
 */
export function TestTimer({
  durationSeconds,
  onTimeUp,
  isPaused = false,
  onRemainingTimeChange,
  isHidden = false,
}: TestTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        const newValue = prev - 1;
        if (onRemainingTimeChange) {
          onRemainingTimeChange(newValue);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp, onRemainingTimeChange]);

  // Notify parent of remaining time changes
  useEffect(() => {
    if (onRemainingTimeChange) {
      onRemainingTimeChange(remainingSeconds);
    }
  }, [remainingSeconds, onRemainingTimeChange]);

  if (isHidden) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Determine color based on remaining time
  let timerColor = "text-gray-900";
  if (remainingSeconds < 60) {
    timerColor = "text-red-600 animate-pulse";
  } else if (remainingSeconds < 300) {
    timerColor = "text-yellow-600";
  }

  return (
    <div className={`flex items-center gap-2 font-mono font-bold ${timerColor}`}>
      <Clock className="w-5 h-5" />
      <span className="text-lg">{formatted}</span>
    </div>
  );
}

