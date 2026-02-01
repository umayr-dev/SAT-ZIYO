/**
 * Admin Exam Date by ID
 * PATCH: update exam date (date, label)
 * DELETE: remove exam date
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const JWT_COOKIE_NAME = "token";
const DATA_FILE = path.join(process.cwd(), "data", "exam-dates.json");

interface ExamDateItem {
  id: string;
  date: string;
  label: string;
}

interface StoredData {
  dates: ExamDateItem[];
  deletedIds: string[];
}

function getToken(request: NextRequest): string | undefined {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
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

async function saveStoredData(data: StoredData): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getToken(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = decodeURIComponent(params.id);
  if (!id) {
    return NextResponse.json({ message: "ID required" }, { status: 400 });
  }

  let body: { date?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON; optional { date, label }" },
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

  const { dates, deletedIds } = await getStoredData();
  const index = dates.findIndex((d) => d.id === id);
  if (index === -1) {
    return NextResponse.json(
      { message: "Exam date not found" },
      { status: 404 }
    );
  }

  const item = dates[index];
  const newDate = dateStr ?? item.date;
  const newLabel =
    typeof body.label === "string" ? body.label.trim() : item.label;
  const updated: ExamDateItem = {
    id: newDate,
    date: newDate,
    label: newLabel || newDate,
  };

  const newDates = dates.slice();
  newDates[index] = updated;
  if (newDate !== id) {
    newDates.sort((a, b) => a.date.localeCompare(b.date));
  }
  await saveStoredData({ dates: newDates, deletedIds });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getToken(_request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = decodeURIComponent(params.id);
  if (!id) {
    return NextResponse.json({ message: "ID required" }, { status: 400 });
  }

  const { dates, deletedIds } = await getStoredData();
  const index = dates.findIndex((d) => d.id === id);
  if (index >= 0) {
    const newDates = dates.filter((d) => d.id !== id);
    await saveStoredData({ dates: newDates, deletedIds });
    return NextResponse.json({ deleted: id });
  }
  const newDeletedIds = deletedIds.includes(id)
    ? deletedIds
    : [...deletedIds, id];
  await saveStoredData({ dates, deletedIds: newDeletedIds });
  return NextResponse.json({ deleted: id });
}
