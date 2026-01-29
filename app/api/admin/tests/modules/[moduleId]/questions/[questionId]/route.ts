/**
 * Admin Test Module Question API Route
 * PATCH /api/admin/tests/modules/:moduleId/questions/:questionId
 * DELETE /api/admin/tests/modules/:moduleId/questions/:questionId
 * Proxies to backend
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { moduleId: string; questionId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    const { moduleId, questionId } = params;

    if (!moduleId || !questionId) {
      return NextResponse.json(
        { message: "Module ID and Question ID required" },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (parseErr) {
      const msg =
        parseErr instanceof Error ? parseErr.message : "Invalid request body";
      console.error("Admin PATCH question body parse error:", parseErr);
      return NextResponse.json(
        {
          message:
            msg.includes("body") || msg.includes("size")
              ? "Request body too large or invalid JSON. Try without large base64 images, or use smaller images."
              : "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        data?.message
          ? { message: data.message }
          : { message: "Failed to update question" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Admin update question error:", error);
    return NextResponse.json(
      { message: msg || "Failed to update question" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string; questionId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    const { moduleId, questionId } = params;

    if (!moduleId || !questionId) {
      return NextResponse.json(
        { message: "Module ID and Question ID required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        data?.message
          ? { message: data.message }
          : { message: "Failed to delete question" },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete question error:", error);
    return NextResponse.json(
      { message: "Failed to delete question" },
      { status: 500 },
    );
  }
}
