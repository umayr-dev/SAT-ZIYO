/**
 * Upload choice image: try backend, then fallback to local public/uploads.
 * POST /api/admin/storage/upload/choice-image
 * Body: multipart/form-data, field "file"
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value ?? null;
  if (token) return token;
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

async function saveChoiceImageLocally(
  file: Blob,
  request: NextRequest,
): Promise<{ url: string }> {
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg" || file.type === "image/jpg"
        ? "jpg"
        : file.type === "image/gif"
          ? "gif"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/svg+xml"
              ? "svg"
              : "png";
  const name = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "choice");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buf);
  const origin =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const base = `${protocol}://${origin}`;
  return { url: `${base}/uploads/choice/${name}` };
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json(
        { message: "No file provided (field: file)" },
        { status: 400 },
      );
    }
    const blob = file instanceof Blob ? file : (file as Blob);
    if ((blob.size ?? 0) === 0) {
      return NextResponse.json({ message: "Empty file" }, { status: 400 });
    }

    const uploadUrl = `${API_CONFIG.baseURL}/storage/upload/choice-image`;
    try {
      const forwardForm = new FormData();
      forwardForm.append("file", blob);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: forwardForm,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return NextResponse.json(data);
      console.warn(
        "Choice image backend upload failed, using local fallback:",
        res.status,
        data,
      );
    } catch (backendErr) {
      console.warn(
        "Choice image backend unreachable, using local fallback:",
        backendErr instanceof Error ? backendErr.message : backendErr,
      );
    }

    const saved = await saveChoiceImageLocally(blob, request);
    return NextResponse.json(saved);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Choice image upload error:", err.message, err.stack);
    return NextResponse.json(
      { message: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
