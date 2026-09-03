/**
 * Admin Dashboard Stats
 * GET /api/admin/stats -> backend GET /admin/stats
 *
 * This used to probe five endpoint names (/admin/stats, /admin/users, /users,
 * /admin/attempts, /admin/test-attempts, /attempts), none of which existed
 * except /admin/users, then rebuild the numbers by pulling the FULL user and
 * test lists over the wire and counting them here. Attempt charts were always
 * empty because nothing exposed attempts platform-wide. The backend now serves
 * the aggregate directly, so this is a passthrough.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(request: NextRequest) {
  let token = request.cookies.get("token")?.value;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_CONFIG.baseURL}/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to load admin stats" },
        { status: response.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { message: "Failed to reach backend" },
      { status: 502 },
    );
  }
}
