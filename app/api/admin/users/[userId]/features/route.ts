/**
 * Admin User Features API Route
 * PATCH /api/admin/users/:userId/features
 * Update user features (isPremium, hasUnlimitedTests, etc.)
 *
 * Proxies to external API `/admin/users/:userId/features` using JWT from HttpOnly cookie (`token`)
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
    console.log("[Admin User Features API] PATCH request received");
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    console.log(`[Admin User Features API] Updating features for user: ${userId}`);

    if (!token) {
      console.log("[Admin User Features API] No token found");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`[Admin User Features API] Request body:`, body);

    // Try /admin/users/:userId/features first, fallback to /users/:userId (direct update)
    const backendUrl1 = `${API_CONFIG.baseURL}/admin/users/${userId}/features`;
    console.log(`[Admin User Features API] Trying backend: ${backendUrl1}`);
    
    let response = await fetch(backendUrl1, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`[Admin User Features API] Backend response status: ${response.status}`);

    // If /admin/users/:userId/features fails with 404, try /users/:userId (update user directly)
    if (!response.ok && response.status === 404) {
      console.log(`[Admin User Features API] First endpoint failed, trying /users/${userId}`);
      // If features endpoint doesn't exist, try updating user directly with feature in body
      response = await fetch(`${API_CONFIG.baseURL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [body.feature]: body.value }),
      });
      console.log(`[Admin User Features API] Fallback response status: ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to update user feature",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin user features PATCH error:", error);
    return NextResponse.json(
      {
        message: "Failed to update user feature",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

