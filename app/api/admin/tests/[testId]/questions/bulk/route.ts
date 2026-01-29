/**
 * Bulk add questions: bitta so'rovda barcha modullarga savollar yuboriladi.
 * POST /api/admin/tests/:testId/questions/bulk
 * Body: { modules: [ { moduleId: string, questions: QuestionInput[] } ] }
 * Backend ga har bir savol alohida POST qilinadi (delay bilan).
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DELAY_MS = 1000;
const MAX_RETRIES_429 = 2;
const RETRY_AFTER_429_MS = 3000;

async function postQuestionWithRetry(
  url: string,
  token: string,
  payload: object,
): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    lastRes = res;
    if (res.status !== 429 || attempt === MAX_RETRIES_429) return res;
    await delay(RETRY_AFTER_429_MS * (attempt + 1));
  }
  return lastRes!;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } },
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: { modules?: Array<{ moduleId?: string; questions?: unknown[] }> };
    try {
      body = await request.json();
    } catch (parseErr) {
      const msg =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      return NextResponse.json(
        {
          message:
            msg.includes("body") ||
            msg.includes("size") ||
            msg.includes("Payload")
              ? "Body juda katta (413). Savollarni sahifa endi har biri alohida yuboradi — rasmlar backend da saqlanadi, barcha qurilmalarda ko'rinadi."
              : "Invalid JSON body",
        },
        { status: 400 },
      );
    }
    const modules = body?.modules;
    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { message: "Body must have modules: [ { moduleId, questions } ]" },
        { status: 400 },
      );
    }

    let totalAdded = 0;
    for (const mod of modules) {
      const { moduleId, questions } = mod;
      if (!moduleId || !Array.isArray(questions)) continue;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload = {
          ...q,
          orderIndex: q.orderIndex ?? i,
        };
        const url = `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions`;
        const res = await postQuestionWithRetry(url, token, payload);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            {
              message: err?.message || "Failed to add question",
              moduleId,
              index: i,
            },
            { status: res.status },
          );
        }
        totalAdded++;
        await delay(DELAY_MS);
      }
    }

    return NextResponse.json({ success: true, totalAdded });
  } catch (error) {
    console.error("Bulk questions error:", error);
    return NextResponse.json({ message: "Bulk add failed" }, { status: 500 });
  }
}
