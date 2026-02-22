/**
 * Exam Dates API (no /admin prefix)
 *
 * GET  /api/exam-dates  -> proxy to backend GET  /exams/dates
 * POST /api/exam-dates  -> proxy to backend POST /exams/dates
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "exam-dates.json");

interface StoredData {
  dates?: { id: string; date: string; label?: string }[];
  deletedIds?: string[];
}

async function getDeletedIds(): Promise<string[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data: StoredData = JSON.parse(raw);
    return Array.isArray(data.deletedIds) ? data.deletedIds : [];
  } catch {
    return [];
  }
}

function getToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("token")?.value || null;
  if (cookieToken) return cookieToken;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const text = await res.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          statusCode: res.status,
          message:
            body?.message ||
            body?.error ||
            `Backend /exams/dates returned ${res.status}`,
          raw: body,
        },
        { status: res.status },
      );
    }

    // Backend datelaridan faqat o'chirilmaganlarini qaytaramiz
    const deletedIds = await getDeletedIds();
    const list: any[] = Array.isArray(body)
      ? body
      : body?.dates || body?.data || [];
    const filtered = deletedIds.length
      ? list.filter((d) => !deletedIds.includes(String(d.id ?? d.date)))
      : list;

    return NextResponse.json(filtered, { status: 200 });
  } catch (err) {
    console.error("[ExamDates] GET error:", err);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to fetch exam dates from backend",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: { date?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body; need { date, label? }" },
      { status: 400 },
    );
  }

  const dateStr = typeof body.date === "string" ? body.date.slice(0, 10) : "";
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { message: "Valid date (YYYY-MM-DD) required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.exams.dates}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Backend 400: "property label should not exist" → faqat { date } yuboramiz
        body: JSON.stringify({ date: dateStr }),
      },
    );

    const text = await res.text();
    let backendBody: any;
    try {
      backendBody = text ? JSON.parse(text) : null;
    } catch {
      backendBody = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          statusCode: res.status,
          message:
            backendBody?.message ||
            backendBody?.error ||
            `Backend /exams/dates returned ${res.status}`,
          raw: backendBody,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(backendBody ?? { date: dateStr }, {
      status: 200,
    });
  } catch (err) {
    console.error("[ExamDates] POST error:", err);
    return NextResponse.json(
      {
        statusCode: 500,
        message: "Failed to add exam date via backend",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
