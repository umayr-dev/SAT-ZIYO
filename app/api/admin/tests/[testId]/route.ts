/**
 * Admin Test API Route
 * GET /api/admin/tests/:testId    - Get test by ID (admin)
 * PATCH /api/admin/tests/:testId   - Update test (admin)
 * DELETE /api/admin/tests/:testId  - Delete test (admin)
 *
 * Proxies to external API `/tests/:testId` using JWT from HttpOnly cookie (`token`)
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

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { testId } = params;

    const response = await fetch(`${API_CONFIG.baseURL}/tests/${testId}`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin tests GET by id error:", error);
    return NextResponse.json(
      { message: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { testId } = params;
    const body = await request.json();

    const response = await fetch(`${API_CONFIG.baseURL}/tests/${testId}`, {
      method: "PATCH",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin tests PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update test" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { testId } = params;

    const response = await fetch(`${API_CONFIG.baseURL}/tests/${testId}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Admin tests DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete test" },
      { status: 500 }
    );
  }
}

