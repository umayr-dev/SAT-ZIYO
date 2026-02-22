/**
 * Admin Exam Date by ID (backend only)
 * PATCH: update exam date
 * DELETE: remove exam date
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

function getToken(request: NextRequest): string | undefined {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const id = decodeURIComponent(params.id);
  if (!id) {
    return NextResponse.json(
      { statusCode: 400, message: "ID required" },
      { status: 400 }
    );
  }

  let body: { date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON; optional { date }" },
      { status: 400 }
    );
  }

  const dateStr =
    typeof body.date === "string"
      ? body.date.trim().slice(0, 10)
      : undefined;
  if (dateStr !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { message: "Valid date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}/${encodeURIComponent(
        id
      )}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          dateStr ? { date: dateStr } : {}
        ),
      }
    );

    const text = await backendRes.text();
    let backendBody: any;
    try {
      backendBody = text ? JSON.parse(text) : null;
    } catch {
      backendBody = text;
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          statusCode: backendRes.status,
          message:
            backendBody?.message ||
            backendBody?.error ||
            `Backend PATCH /exams/dates/${id} returned ${backendRes.status}`,
          raw: backendBody,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(backendBody ?? { id, date: dateStr }, {
      status: 200,
    });
  } catch (err) {
    console.error("[Admin exam-dates] PATCH error:", err);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to update exam date via backend",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const id = decodeURIComponent(params.id);
  if (!id) {
    return NextResponse.json(
      { statusCode: 400, message: "ID required" },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}/${encodeURIComponent(
        id
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = await backendRes.text();
    let backendBody: any;
    try {
      backendBody = text ? JSON.parse(text) : null;
    } catch {
      backendBody = text;
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          statusCode: backendRes.status,
          message:
            backendBody?.message ||
            backendBody?.error ||
            `Backend DELETE /exams/dates/${id} returned ${backendRes.status}`,
          raw: backendBody,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(backendBody ?? { deleted: id }, { status: 200 });
  } catch (err) {
    console.error("[Admin exam-dates] DELETE error:", err);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to delete exam date via backend",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
