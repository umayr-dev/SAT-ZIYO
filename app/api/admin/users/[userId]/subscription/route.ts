/**
 * Admin User Subscription API Route
 * POST   /api/admin/users/:userId/subscription   -> grant premium (days)
 * DELETE /api/admin/users/:userId/subscription   -> revoke premium
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const backendUrl = `${API_CONFIG.baseURL}/admin/users/${userId}/subscription`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to grant subscription",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Admin Subscription POST] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to grant subscription",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = `${API_CONFIG.baseURL}/admin/users/${userId}/subscription`;
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to revoke subscription",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Admin Subscription DELETE] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to revoke subscription",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

