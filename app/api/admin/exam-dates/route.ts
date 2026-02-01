/**
 * Admin Exam Dates API
 * GET: list (same as /api/exams/dates, with admin auth)
 * POST: add new exam date (backend or local file fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";
import { promises as fs } from "fs";
import path from "path";

const JWT_COOKIE_NAME = "token";
const DATA_FILE = path.join(process.cwd(), "data", "exam-dates.json");

export interface ExamDateItem {
  id: string;
  date: string;
  label: string;
}

interface StoredData {
  dates: ExamDateItem[];
  deletedIds: string[];
}

async function getStoredData(): Promise<StoredData> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return { dates: data, deletedIds: [] };
    }
    return {
      dates: data.dates || [],
      deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
    };
  } catch {
    return { dates: [], deletedIds: [] };
  }
}

async function getStoredDates(): Promise<ExamDateItem[]> {
  const { dates } = await getStoredData();
  return dates;
}

async function saveStoredDates(items: ExamDateItem[]): Promise<void> {
  const current = await getStoredData();
  await saveStoredData({ dates: items, deletedIds: current.deletedIds });
}

async function saveStoredData(data: StoredData): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
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
      id: d.id || d.date || String(d),
      date: typeof d.date === "string" ? d.date.slice(0, 10) : String(d.date || d),
      label: d.label || d.date || "",
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
    return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
  }

  try {
    let fromBackend: ExamDateItem[] = [];
    const backendRes = await fetch(`${API_CONFIG.baseURL}/exams/dates`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      fromBackend = normalizeDates(data);
    }

    const { dates: fromFile, deletedIds } = await getStoredData();
    const byDate = new Map<string, ExamDateItem>();
    fromBackend.forEach((d) => {
      if (!deletedIds.includes(d.id)) byDate.set(d.date, d);
    });
    fromFile.forEach((d) => byDate.set(d.date, d));
    const merged = Array.from(byDate.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Admin exam dates GET error:", error);
    const { dates: fromFile } = await getStoredData().catch(() => ({ dates: [], deletedIds: [] }));
    return NextResponse.json(fromFile);
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body; need { date, label }" },
      { status: 400 }
    );
  }

  const dateStr = typeof body.date === "string" ? body.date.slice(0, 10) : "";
  const label = typeof body.label === "string" ? body.label : dateStr || "Exam date";

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { message: "Valid date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  // Backend real response (when request was made)
  let backendStatus: number | null = null;
  let backendBody: string | object | null = null;

  try {
    const backendRes = await fetch(`${API_CONFIG.baseURL}/exams/dates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, label }),
    });

    backendStatus = backendRes.status;
    const text = await backendRes.text();
    try {
      backendBody = text ? JSON.parse(text) : null;
    } catch {
      backendBody = text;
    }

    if (backendRes.ok) {
      const data = backendBody;
      const normalized = normalizeDates(Array.isArray(data) ? data : data ? [data] : []);
      const item = normalized[0] || { id: dateStr, date: dateStr, label };
      return NextResponse.json(item);
    }
    console.warn("[Admin exam-dates] Backend POST failed:", backendStatus, backendBody);
  } catch (err) {
    console.warn("[Admin exam-dates] Backend unreachable:", err);
  }

  // Fallback: save to local file
  try {
    const { dates: stored } = await getStoredData();
    if (stored.some((d) => d.date === dateStr)) {
      return NextResponse.json(
        { message: "This date already exists" },
        { status: 409 }
      );
    }

    const newItem: ExamDateItem = { id: dateStr, date: dateStr, label };
    stored.push(newItem);
    stored.sort((a, b) => a.date.localeCompare(b.date));
    await saveStoredDates(stored);

    return NextResponse.json(newItem);
  } catch (err) {
    console.error("[Admin exam-dates] Local save error:", err);
    return NextResponse.json(
      {
        backendResponse: backendStatus != null
          ? { status: backendStatus, body: backendBody }
          : null,
        localSaveError: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

