/**
 * Get Available Exam Dates API Route
 * GET /api/exams/dates
 * Returns list of exam dates: backend + admin-added (data/exam-dates.json)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";
import { promises as fs } from "fs";
import path from "path";

const JWT_COOKIE_NAME = "token";
const DATA_FILE = path.join(process.cwd(), "data", "exam-dates.json");

function getToken(request: NextRequest): string | undefined {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
}

function normalizeDates(data: unknown): { id: string; date: string; label: string }[] {
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

async function getStoredDates(): Promise<{ id: string; date: string; label: string }[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.dates || [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let fromBackend: { id: string; date: string; label: string }[] = [];
    const backendRes = await fetch(`${API_CONFIG.baseURL}/exams/dates`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      fromBackend = normalizeDates(data);
    }

    const fromFile = await getStoredDates();
    const byDate = new Map<string, { id: string; date: string; label: string }>();
    fromBackend.forEach((d) => byDate.set(d.date, d));
    fromFile.forEach((d) => byDate.set(d.date, d));
    const merged = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Get exam dates error:", error);
    const fromFile = await getStoredDates().catch(() => []);
    return NextResponse.json(fromFile);
  }
}
