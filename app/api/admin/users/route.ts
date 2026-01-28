/**
 * Admin Users API Route
 * GET /api/admin/users
 * Returns list of all users
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

    // Get query parameters for filtering, pagination, sorting
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query string
    const queryParams = new URLSearchParams();
    if (role) queryParams.append("role", role);
    if (isActive !== null) queryParams.append("isActive", isActive);
    if (search) queryParams.append("search", search);
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    queryParams.append("sortBy", sortBy);
    queryParams.append("sortOrder", sortOrder);

    const queryString = queryParams.toString();
    const url = `${API_CONFIG.baseURL}/admin/users${queryString ? `?${queryString}` : ""}`;

    console.log(`[Admin Users API] Fetching users from ${url}`);
    console.log(`[Admin Users API] Token present: ${!!token}`);

    // Try /admin/users first, fallback to /users
    let response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    // If /admin/users fails with 404, try /users (without query params for fallback)
    if (!response.ok && response.status === 404) {
      console.log(`[Admin Users API] /admin/users returned 404, trying /users`);
      response = await fetch(`${API_CONFIG.baseURL}/users`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
    }

    console.log(
      `[Admin Users API] Backend response status: ${response.status}`,
    );

    if (response.ok) {
      const users = await response.json();

      // Normalize backend shape to { data: [...users], meta: {...} }
      const dataArray = Array.isArray(users)
        ? users
        : Array.isArray(users?.data)
          ? users.data
          : Array.isArray(users?.users)
            ? users.users
            : [];

      const meta = users?.meta || {
        total: dataArray.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(
          (users?.meta?.total || dataArray.length || 1) / Number(limit || "10"),
        ),
      };

      console.log(
        `[Admin Users API] Returning ${dataArray.length} users (page ${meta.page}/${meta.totalPages})`,
      );

      return NextResponse.json(
        {
          data: dataArray,
          meta,
        },
        {
          status: 200,
        },
      );
    }

    const errorBody = await response.json().catch(() => ({}));
    console.error(`[Admin Users API] Backend error:`, errorBody);

    return NextResponse.json(
      {
        error:
          errorBody.message ||
          errorBody.error ||
          `Backend /users returned ${response.status}`,
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("[Admin Users API] Fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
