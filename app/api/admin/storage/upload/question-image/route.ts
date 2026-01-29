/**
 * Upload question image: try backend, then fallback to local public/uploads.
 * POST /api/admin/storage/upload/question-image
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

/** Save file to public/uploads/question and return public URL path */
async function saveQuestionImageLocally(
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
  const dir = path.join(process.cwd(), "public", "uploads", "question");
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
  return { url: `${base}/uploads/question/${name}` };
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
    const size = blob.size ?? 0;
    if (size === 0) {
      return NextResponse.json({ message: "Empty file" }, { status: 400 });
    }

    const uploadUrl = `${API_CONFIG.baseURL}/storage/upload/question-image`;
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
        "Question image backend upload failed, using local fallback:",
        res.status,
        data,
      );
    } catch (backendErr) {
      console.warn(
        "Question image backend unreachable, using local fallback:",
        backendErr instanceof Error ? backendErr.message : backendErr,
      );
    }

    const saved = await saveQuestionImageLocally(blob, request);
    return NextResponse.json(saved);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Question image upload error:", err.message, err.stack);
    return NextResponse.json(
      { message: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
