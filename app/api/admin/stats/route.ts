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

      const attemptsResponse = await fetch(
        `${API_CONFIG.baseURL}/admin/attempts`,
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

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

      let attempts: any[] = [];
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        attempts = Array.isArray(attemptsData)
          ? attemptsData
          : Array.isArray(attemptsData?.data)
            ? attemptsData.data
            : [];
        console.log(`[Admin Stats] Fetched ${attempts.length} attempts`);
      } else {
        console.warn(
          `[Admin Stats] Attempts fetch failed: ${attemptsResponse.status} ${attemptsResponse.statusText}`,
        );
      }

      const hourDistribution = calculateHourDistribution(attempts);

      return NextResponse.json(
        {
          usersCount: usersTotal,
          testsCount: testsTotal,
          hourDistribution,
        },
        { status: 200 },
      );
    } catch (backendError) {
      console.warn(
        "Backend endpoints not available, using mock data:",
        backendError,
      );

      return NextResponse.json(
        {
          usersCount: 0,
          testsCount: 0,
          hourDistribution: generateMockHourDistribution(),
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
        hourDistribution: generateMockHourDistribution(),
      },
      { status: 200 },
    );
  }
}

function calculateHourDistribution(
  attempts: any[],
): { hour: number; count: number }[] {
  const hourCounts: { [key: number]: number } = {};

  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  attempts.forEach((attempt) => {
    if (attempt.startedAt) {
      const date = new Date(attempt.startedAt);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }));
}

function generateMockHourDistribution(): { hour: number; count: number }[] {
  const distribution = [];
  for (let i = 0; i < 24; i++) {
    let count = 0;
    if (i >= 9 && i <= 11) {
      count = Math.floor(Math.random() * 20) + 10;
    } else if (i >= 19 && i <= 21) {
      count = Math.floor(Math.random() * 15) + 8;
    } else {
      count = Math.floor(Math.random() * 5);
    }
    distribution.push({ hour: i, count });
  }
  return distribution;
}
