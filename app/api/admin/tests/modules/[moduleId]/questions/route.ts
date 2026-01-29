/**
 * Admin Test Module Questions API Route
 * POST /api/admin/tests/modules/:moduleId/questions
 * Proxies to backend POST /tests/modules/:moduleId/questions
 * Body format: IMAGE_UPLOAD_API.md Method 1 (questionText, orderIndex, difficulty,
 * imageBase64, choices[].imageBase64, passage, contentDomain, etc.)
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
  { params }: { params: { moduleId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    const { moduleId } = params;

    if (!moduleId) {
      return NextResponse.json(
        { message: "Module ID required" },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        { message: "Invalid JSON or body too large" },
        { status: 400 },
      );
    }

    const backendUrl = `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        data?.message ??
        data?.error ??
        (response.status === 500
          ? "Backend xato (500). Backend loglarini tekshiring."
          : "Failed to add question");
      if (response.status === 413) {
        return NextResponse.json(
          {
            message:
              "Payload juda katta (413). Rasmni kichikroq qiling yoki backend body limitini oshiring.",
          },
          { status: 413 },
        );
      }
      console.error(
        "[POST question] Backend not ok:",
        response.status,
        backendUrl,
        data,
      );
      return NextResponse.json({ message: msg }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to add question";
    console.error("Admin add question error:", error);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
