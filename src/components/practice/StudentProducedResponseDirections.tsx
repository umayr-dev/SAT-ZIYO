"use client";

import { memo } from "react";

export type SprDirectionsVariant =
  | "desktopLeft"
  | "desktopInline"
  | "mathSingleColumn"
  | "mobile";

export interface StudentProducedResponseDirectionsProps {
  variant?: SprDirectionsVariant;
}

export const StudentProducedResponseDirections = memo(
  function StudentProducedResponseDirections({
    variant = "desktopLeft",
  }: StudentProducedResponseDirectionsProps) {
    const isMobile = variant === "mobile";
    const isMathSingle = variant === "mathSingleColumn";

    return (
      <div
        className={
          isMobile
            ? "pt-5 p-3 sm:p-4 mb-3 sm:mb-5 bg-gray-50/80 rounded-lg text-xs sm:text-sm leading-relaxed"
            : isMathSingle
              ? "pt-5 p-3 sm:p-4 md:p-5 bg-gray-50/80 rounded-lg text-xs sm:text-sm md:text-base leading-relaxed mb-4"
              : "pt-5 p-3 sm:p-4 md:p-5 bg-white rounded-lg text-xs sm:text-sm md:text-base leading-relaxed"
        }
      >
        <h2
          className={
            isMobile
              ? "text-sm sm:text-base md:text-lg font-bold text-black mb-2 sm:mb-3"
              : "text-sm sm:text-base md:text-lg font-bold text-black mb-2 sm:mb-3 md:mb-4"
          }
        >
          Student-Produced Response Directions
        </h2>
        <ul
          className={
            isMobile
              ? "list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-2 sm:mb-3 text-gray-800 text-xs sm:text-sm"
              : "list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 mb-2 sm:mb-3 md:mb-4 text-gray-800"
          }
        >
          <li>
            If you find more than one correct answer, enter only one answer.
          </li>
          <li>
            {isMobile ? (
              <>
                You can enter up to 5 characters for a positive answer and up to
                6 (including the negative sign) for a negative answer.
              </>
            ) : (
              <>
                You can enter up to 5 characters for a positive answer and up
                to 6 characters (including the negative sign) for a negative
                answer.
              </>
            )}
          </li>
          <li>
            {isMobile ? (
              <>
                If your answer is a fraction that doesn&apos;t fit, enter the
                decimal equivalent.
              </>
            ) : (
              <>
                If your answer is a fraction that doesn&apos;t fit in the
                provided space, enter the decimal equivalent.
              </>
            )}
          </li>
          <li>
            {isMobile ? (
              <>
                If your answer is a decimal that doesn&apos;t fit, enter it by
                truncating or rounding at the fourth digit.
              </>
            ) : (
              <>
                If your answer is a decimal that doesn&apos;t fit in the
                provided space, enter it by truncating or rounding at the fourth
                digit.
              </>
            )}
          </li>
          <li>
            {isMobile ? (
              <>
                If your answer is a mixed number (e.g. 3½), enter it as an
                improper fraction (7/2) or decimal (3.5).
              </>
            ) : (
              <>
                If your answer is a mixed number (such as 3½), enter it as an
                improper fraction (7/2) or its decimal equivalent (3.5).
              </>
            )}
          </li>
          <li>
            {isMobile ? (
              <>Don&apos;t enter symbols such as %, comma, or $.</>
            ) : (
              <>
                Don&apos;t enter symbols such as a percent sign, comma, or
                dollar sign.
              </>
            )}
          </li>
        </ul>
        <p
          className={
            isMobile
              ? "font-semibold text-black mb-1 sm:mb-1.5 text-xs sm:text-sm"
              : "font-semibold text-black mb-1 sm:mb-2 text-xs sm:text-sm"
          }
        >
          Examples
        </p>
        <div
          className={
            isMobile
              ? "overflow-x-auto border border-gray-300 rounded text-xs sm:text-sm"
              : "overflow-x-auto border border-gray-300 rounded-lg"
          }
        >
          <table
            className={`w-full ${isMobile ? "" : "text-xs sm:text-sm"} border-collapse`}
          >
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th
                  className={`text-left ${isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"} font-semibold text-black border-r border-gray-300`}
                >
                  Answer
                </th>
                <th
                  className={`text-left ${isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"} font-semibold text-black border-r border-gray-300`}
                >
                  {isMobile ? "Acceptable" : "Acceptable ways to enter answer"}
                </th>
                <th
                  className={`text-left ${isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"} font-semibold text-black`}
                >
                  {isMobile
                    ? "Unacceptable"
                    : "Unacceptable: will NOT receive credit"}
                </th>
              </tr>
            </thead>
            <tbody className={isMobile ? undefined : "text-gray-800"}>
              <tr className="border-b border-gray-200">
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  3.5
                </td>
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  3.5, 3.50, 7/2
                </td>
                <td className={isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"}>
                  3 1/2
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  2/3
                </td>
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  2/3, .6666, .6667, 0.666, 0.667
                </td>
                <td className={isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"}>
                  0.66, .66, 0.67, .67
                </td>
              </tr>
              <tr>
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  -1/3
                </td>
                <td
                  className={`${isMobile ? "p-1 sm:p-1.5 border-r" : "p-1 sm:p-2 border-r border-gray-200"}`}
                >
                  -1/3, -.3333, -0.333
                </td>
                <td className={isMobile ? "p-1 sm:p-1.5" : "p-1 sm:p-2"}>
                  -.33, -0.33
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);
