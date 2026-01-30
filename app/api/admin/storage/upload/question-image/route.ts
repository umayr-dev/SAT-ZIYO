/**
 * Proxy: POST /api/admin/storage/upload/question-image
 * Backend: POST /storage/upload/question-image (IMAGE_UPLOAD_API.md Method 2)
 * multipart/form-data, field: file
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { message: "Missing or invalid file in form field 'file'" },
        { status: 400 },
      );
    }

    const backendForm = new FormData();
    backendForm.append("file", file);

    const backendUrl = `${API_CONFIG.baseURL}/storage/upload/question-image`;
    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: backendForm,
      });
    } catch (fetchErr) {
      const errMsg =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[question-image] Backend fetch failed:", errMsg);
      return NextResponse.json(
        {
          message: `Backend unreachable (${backendUrl}). ${errMsg}. Check backend is running and storage/upload/question-image exists.`,
        },
        { status: 502 },
      );
    }

    const text = await response.text();
    const data = (() => {
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    })();

    if (!response.ok) {
      const msg =
        data?.message ??
        data?.error ??
        (response.status === 500
          ? "Backend 500: server error (e.g. GCS config). Check backend logs."
          : "Question image upload failed");
      console.error(
        "[question-image] Backend:",
        response.status,
        text.slice(0, 500),
      );
      return NextResponse.json(
        { message: msg, ...(data?.details && { details: data.details }) },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[question-image] Error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Question image upload failed",
      },
      { status: 500 },
    );
  }
}
