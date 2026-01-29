/**
 * Admin Test Module Questions API Route
 * POST /api/admin/tests/modules/:moduleId/questions
 * Proxies to backend POST /tests/modules/:moduleId/questions
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value || null;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { moduleId } = params;

    if (!moduleId) {
      return NextResponse.json(
        { message: "Module ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions`,
      {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        data?.message ? { message: data.message } : { message: "Failed to add question" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin add question error:", error);
    return NextResponse.json(
      { message: "Failed to add question" },
      { status: 500 }
    );
  }
}

