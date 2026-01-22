/**
 * Admin User API Route
 * PATCH /api/admin/users/:userId
 * Update user information (name, email, role)
 *
 * Proxies to external API `/admin/users/:userId` using JWT from HttpOnly cookie (`token`)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  let token = request.cookies.get("token")?.value || null;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Try /admin/users/:userId first, fallback to /users/:userId
    let response = await fetch(`${API_CONFIG.baseURL}/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // If /admin/users/:userId fails with 404, try /users/:userId
    if (!response.ok && response.status === 404) {
      response = await fetch(`${API_CONFIG.baseURL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to update user",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json(
      {
        message: "Failed to update user",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

