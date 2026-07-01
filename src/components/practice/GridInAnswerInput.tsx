"use client";

import { memo } from "react";

export interface GridInAnswerInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const GridInAnswerInput = memo(function GridInAnswerInput({
  value,
  onChange,
}: GridInAnswerInputProps) {
  return (
    <div className="mt-3 pt-2 space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer (e.g. 5.566, -5.566, 2/3, -2/3)"
        pattern="[0-9.\\-/]+"
        className="max-w-[180px] sm:max-w-[220px] md:max-w-[240px] w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
      />
    </div>
  );
});
