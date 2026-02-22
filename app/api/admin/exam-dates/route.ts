/**
 * Admin Exam Dates API (backend only)
 * GET: list from backend
 * POST: add new exam date via backend
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export interface ExamDateItem {
  id: string;
  date: string;
  label: string;
}

function getToken(request: NextRequest): string | undefined {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
}

function normalizeDates(data: unknown): ExamDateItem[] {
  if (Array.isArray(data)) {
    return data.map((d: any) => ({
      id: String(d.id ?? d.date),
      date:
        typeof d.date === "string"
          ? d.date.slice(0, 10)
          : String(d.date ?? ""),
      label:
        typeof d.label === "string" && d.label.length > 0
          ? d.label
          : typeof d.date === "string"
            ? d.date.slice(0, 10)
            : String(d.date ?? ""),
    }));
  }
  if (data && typeof data === "object" && "dates" in data) {
    return normalizeDates((data as { dates: unknown }).dates);
  }
  if (data && typeof data === "object" && "data" in data) {
    return normalizeDates((data as { data: unknown }).data);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const backendRes = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = await backendRes.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          statusCode: backendRes.status,
          message:
            body?.message ||
            body?.error ||
            `Backend /exams/dates returned ${backendRes.status}`,
          raw: body,
        },
        { status: backendRes.status }
      );
    }

    const list = normalizeDates(body);
    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    console.error("Admin exam dates GET error:", error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to fetch exam dates from backend",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { date?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body; need { date, label? }" },
      { status: 400 }
    );
  }

  const dateStr = typeof body.date === "string" ? body.date.slice(0, 10) : "";
  const label =
    typeof body.label === "string" && body.label.length > 0
      ? body.label
      : dateStr || "Exam date";

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { message: "Valid date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Backend currently only accepts { date }
        body: JSON.stringify({ date: dateStr }),
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
            `Backend /exams/dates returned ${backendRes.status}`,
          raw: backendBody,
        },
        { status: backendRes.status }
      );
    }

    const normalized = normalizeDates(
      Array.isArray(backendBody)
        ? backendBody
        : backendBody
          ? [backendBody]
          : []
    );
    const item =
      normalized[0] || ({ id: dateStr, date: dateStr, label } as ExamDateItem);

    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    console.error("[Admin exam-dates] Backend POST error:", err);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to add exam date via backend",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

