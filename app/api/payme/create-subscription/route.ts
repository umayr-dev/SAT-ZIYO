import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieCandidates = ["token", "accessToken", "access_token", "jwt"];
  for (const cookieName of cookieCandidates) {
    const cookieToken = request.cookies.get(cookieName)?.value?.trim();
    if (cookieToken) return cookieToken;
  }

  const authHeader =
    request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim();

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        {
          message:
            "Unauthorized: JWT token not found. Send token cookie or Authorization: Bearer <token>.",
        },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${API_CONFIG.baseURL}/payme/create-subscription`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to create subscription", ...data },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to initialize Payme payment" },
      { status: 500 },
    );
  }
}

