/**
 * Admin Stats API Route
 * GET /api/admin/stats
 * Returns statistics for admin dashboard
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get("token")?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    try {
      const adminStatsResponse = await fetch(
        `${API_CONFIG.baseURL}/admin/stats`,
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (adminStatsResponse.ok) {
        const adminStats = await adminStatsResponse.json();
        return NextResponse.json(adminStats, { status: 200 });
      }

      // Try /admin/users first, fallback to /users
      let usersResponse = await fetch(`${API_CONFIG.baseURL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      // If /admin/users fails, try /users
      if (!usersResponse.ok && usersResponse.status === 404) {
        usersResponse = await fetch(`${API_CONFIG.baseURL}/users`, {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
      }

      const testsResponse = await fetch(`${API_CONFIG.baseURL}/tests`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      const attemptEndpoints = [
        "/admin/attempts",
        "/admin/test-attempts",
        "/attempts",
      ];
      let attempts: any[] = [];
      for (const path of attemptEndpoints) {
        const attemptsResponse = await fetch(
          `${API_CONFIG.baseURL}${path}`,
          {
            method: "GET",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          },
        );
        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json().catch(() => ({}));
          const list = Array.isArray(attemptsData)
            ? attemptsData
            : Array.isArray(attemptsData?.data)
              ? attemptsData.data
              : [];
          attempts = normalizeAttempts(list);
          console.log(`[Admin Stats] Fetched ${attempts.length} attempts from ${path}`);
          break;
        }
      }
      if (attempts.length === 0) {
        console.warn("[Admin Stats] No attempts from any admin endpoint");
      }

      let users: any[] = [];
      let usersTotal = 0;
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Support both paginated and non-paginated shapes
        if (Array.isArray(usersData)) {
          users = usersData;
          usersTotal = usersData.length;
        } else {
          users = Array.isArray(usersData?.data) ? usersData.data : [];
          usersTotal =
            typeof usersData?.meta?.total === "number"
              ? usersData.meta.total
              : users.length;
        }
        console.log(
          `[Admin Stats] Fetched ${users.length} users (total: ${usersTotal})`,
        );
      } else {
        console.warn(
          `[Admin Stats] Users fetch failed: ${usersResponse.status} ${usersResponse.statusText}`,
        );
      }

      let tests: any[] = [];
      let testsTotal = 0;
      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        if (Array.isArray(testsData)) {
          tests = testsData;
          testsTotal = testsData.length;
        } else {
          tests = Array.isArray(testsData?.data) ? testsData.data : [];
          testsTotal =
            typeof testsData?.meta?.total === "number"
              ? testsData.meta.total
              : tests.length;
        }
        console.log(
          `[Admin Stats] Fetched ${tests.length} tests (total: ${testsTotal})`,
        );
      } else {
        console.warn(
          `[Admin Stats] Tests fetch failed: ${testsResponse.status} ${testsResponse.statusText}`,
        );
      }

      const hourDistribution = calculateHourDistribution(attempts);
      const dayDistribution = calculateDayDistribution(attempts);

      return NextResponse.json(
        {
          usersCount: usersTotal,
          testsCount: testsTotal,
          hourDistribution,
          dayDistribution,
          totalAttempts: attempts.length,
        },
        { status: 200 },
      );
    } catch (backendError) {
      console.warn(
        "Backend endpoints not available, returning empty stats:",
        backendError,
      );

      return NextResponse.json(
        {
          usersCount: 0,
          testsCount: 0,
          hourDistribution: emptyHourDistribution(),
          dayDistribution: [],
          totalAttempts: 0,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      {
        usersCount: 0,
        testsCount: 0,
        hourDistribution: emptyHourDistribution(),
        dayDistribution: [],
        totalAttempts: 0,
      },
      { status: 200 },
    );
  }
}

/** Normalize attempt objects: support startedAt, createdAt, start_time (snake_case) */
function normalizeAttempts(list: any[]): any[] {
  return list.map((a) => ({
    ...a,
    startedAt:
      a.startedAt ?? a.createdAt ?? a.start_time ?? a.started_at ?? null,
  }));
}

function calculateHourDistribution(
  attempts: any[],
): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;

  attempts.forEach((attempt) => {
    const at = attempt.startedAt ?? attempt.createdAt ?? attempt.start_time ?? attempt.started_at;
    if (at) {
      const hour = new Date(at).getHours();
      if (hour >= 0 && hour <= 23) hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
  });

  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour, 10),
    count,
  }));
}

/** Son qancha kun bo‘yicha: har kuni nechta attempt (UTC date key) */
function calculateDayDistribution(
  attempts: any[],
  daysBack = 30,
): { date: string; count: number }[] {
  const dayCounts: Record<string, number> = {};
  const today = new Date();
  for (let d = 0; d < daysBack; d++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - d);
    const key = date.toISOString().slice(0, 10);
    dayCounts[key] = 0;
  }

  attempts.forEach((attempt) => {
    const at = attempt.startedAt ?? attempt.createdAt ?? attempt.start_time ?? attempt.started_at;
    if (at) {
      const key = new Date(at).toISOString().slice(0, 10);
      if (dayCounts[key] !== undefined) dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    }
  });

  return Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function emptyHourDistribution(): { hour: number; count: number }[] {
  return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
}
