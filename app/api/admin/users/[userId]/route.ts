/**
 * Admin User API Route
 * PATCH /api/admin/users/:userId
 * Update user information (name, email, role)
 *
 * Proxies to external API `/admin/users/:userId` using JWT from HttpOnly cookie (`token`)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  let token = request.cookies.get("token")?.value || null;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { userId } = resolvedParams;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`[Admin User PATCH] Updating user ${userId} with:`, body);
    console.log(`[Admin User PATCH] Backend URL: ${API_CONFIG.baseURL}`);

    // If role is being updated, use the role-specific endpoint
    if (body.role !== undefined) {
      try {
        console.log(`[Admin User PATCH] Updating role via /auth/users/role`);
        const roleResponse = await fetch(`${API_CONFIG.baseURL}/auth/users/role`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            role: body.role,
          }),
          credentials: "include",
        });

        console.log(`[Admin User PATCH] /auth/users/role response status:`, roleResponse.status);

        if (roleResponse.ok) {
          const roleData = await roleResponse.json().catch(() => ({}));
          
          // Remove role from body to check if there are other fields
          const bodyWithoutRole = { ...body };
          delete bodyWithoutRole.role;
          
          // If only role is being updated, return success immediately
          if (Object.keys(bodyWithoutRole).length === 0) {
            return NextResponse.json({
              ...roleData,
              role: body.role,
            }, { status: roleResponse.status });
          }
          
          // If other fields are also being updated, try to update them
          // But if they fail, still return success for role update
          try {
            // Try to update other fields, but don't fail if endpoint doesn't exist
            const otherFieldsResponse = await fetch(`${API_CONFIG.baseURL}/admin/users/${userId}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(bodyWithoutRole),
              credentials: "include",
            });
            
            if (otherFieldsResponse.ok) {
              const otherFieldsData = await otherFieldsResponse.json().catch(() => ({}));
              return NextResponse.json({
                ...roleData,
                ...otherFieldsData,
                role: body.role,
              }, { status: 200 });
            }
            
            // If other fields update fails, still return success for role
            console.warn(`[Admin User PATCH] Role updated successfully, but other fields update failed:`, otherFieldsResponse.status);
            return NextResponse.json({
              ...roleData,
              role: body.role,
              warning: "Role updated successfully, but some fields could not be updated",
            }, { status: 200 });
          } catch (otherFieldsErr) {
            // If other fields update fails, still return success for role
            console.warn(`[Admin User PATCH] Role updated successfully, but other fields update error:`, otherFieldsErr);
            return NextResponse.json({
              ...roleData,
              role: body.role,
              warning: "Role updated successfully, but some fields could not be updated",
            }, { status: 200 });
          }
        } else {
          const errorData = await roleResponse.json().catch(() => ({}));
          console.error(`[Admin User PATCH] Role update failed:`, errorData);
          return NextResponse.json(
            {
              message: errorData.message || errorData.error || `Failed to update user role (${roleResponse.status})`,
              error: errorData.error || `Backend returned ${roleResponse.status}`,
            },
            { status: roleResponse.status }
          );
        }
      } catch (err) {
        console.error(`[Admin User PATCH] Error updating role:`, err);
        return NextResponse.json(
          {
            message: "Failed to update user role",
            error: err instanceof Error ? err.message : String(err),
          },
          { status: 500 }
        );
      }
    }

    // For other fields (name, email, etc.), try multiple endpoint variants
    let lastResponse: Response | null = null;
    let lastError: string = "";
    let lastStatus: number = 0;

    // This code should not be reached if role was updated above
    // But keep it as fallback for cases where role is not in the update
    // Use body directly since role is not being updated
    const bodyToUpdate = body;

    // Try 1: /admin/users/:userId
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToUpdate),
        credentials: "include",
      });
      console.log(`[Admin User PATCH] /admin/users/${userId} response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
      }
      
      lastResponse = response;
      lastStatus = response.status;
      
      if (response.status !== 404 && response.status !== 405) {
        // If it's not 404/405, return the error immediately
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            message: errorData.message || errorData.error || `Failed to update user (${response.status})`,
            error: errorData.error || `Backend returned ${response.status}`,
          },
          { status: response.status }
        );
      }
      
      lastError = `Backend returned ${response.status}`;
    } catch (err) {
      console.error(`[Admin User PATCH] Error trying /admin/users/${userId}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
    }

    // Try 2: /users/:userId
    try {
      console.log(`[Admin User PATCH] Trying fallback endpoint /users/${userId}`);
      const response = await fetch(`${API_CONFIG.baseURL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToUpdate),
        credentials: "include",
      });
      console.log(`[Admin User PATCH] /users/${userId} response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
      }
      
      lastResponse = response;
      lastStatus = response.status;
      lastError = `Backend returned ${response.status}`;
    } catch (err) {
      console.error(`[Admin User PATCH] Error trying /users/${userId}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
    }

    // If all endpoints failed, return error
    if (!lastResponse) {
      return NextResponse.json(
        {
          message: "Failed to connect to backend server",
          error: lastError || "No response from backend",
        },
        { status: 503 }
      );
    }

    // If we reach here, all endpoints failed
    const errorData = await lastResponse.json().catch(() => ({}));
    console.error(`[Admin User PATCH] All endpoints failed. Last error:`, {
      status: lastStatus,
      data: errorData,
      lastError,
    });
    
    return NextResponse.json(
      {
        message: errorData.message || errorData.error || `Failed to update user. Backend endpoint not found (${lastStatus})`,
        error: errorData.error || lastError || `Backend returned ${lastStatus}`,
        details: "Please check if the backend API endpoint is available and the user ID is correct.",
      },
      { status: lastStatus || 404 }
    );
  } catch (error) {
    console.error("[Admin User PATCH] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to update user",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

