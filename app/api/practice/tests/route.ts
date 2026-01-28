/**
 * Practice Tests API Route
 * GET /api/practice/tests
 * Get available practice tests for students
 *
 * Proxies to external API `/practice/tests` using JWT from HttpOnly cookie (`token`)
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

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const backendUrl = `${API_CONFIG.baseURL}/practice/tests`;

    console.log("[Practice Tests API] Fetching from:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Practice Tests API] Backend error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        { 
          message: errorData.message || errorData.error || "Failed to fetch tests",
          error: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => []);
    
    // Transform backend response to match frontend Test interface
    // Backend returns: { id, title, description, totalDuration, totalQuestions, sections: [{ type, duration, moduleCount, allowCalculator }] }
    // Frontend expects: { id, title, description, isActive, sections: [{ sectionType, duration, allowCalculator, modules: [{ moduleNumber, questionCount, duration }] }] }
    const transformedTests = Array.isArray(data) ? data.map((test: any) => {
      // If test already has the correct structure, return as is
      if (test.sections && Array.isArray(test.sections) && test.sections.length > 0) {
        const firstSection = test.sections[0];
        // Check if it's already in the correct format (has modules array)
        if (firstSection.modules && Array.isArray(firstSection.modules)) {
          return {
            ...test,
            isActive: test.isActive ?? true, // Default to true if not provided
            sections: test.sections.map((section: any) => ({
              sectionType: section.sectionType || section.type,
              duration: section.duration,
              allowCalculator: section.allowCalculator,
              modules: section.modules || [],
            })),
          };
        }
        
        // Transform from backend format to frontend format
        // Backend has: sections: [{ type, duration, moduleCount, allowCalculator }]
        // We need: sections: [{ sectionType, duration, allowCalculator, modules: [{ moduleNumber, questionCount, duration }] }]
        return {
          id: test.id,
          title: test.title,
          description: test.description,
          isActive: test.isActive ?? true,
          totalDuration: test.totalDuration,
          totalQuestions: test.totalQuestions,
          sections: test.sections.map((section: any, sectionIndex: number) => {
            // If backend provides moduleCount, create placeholder modules
            // Otherwise, try to get modules from test structure
            const moduleCount = section.moduleCount || 2; // Default to 2 modules per section
            const sectionDuration = section.duration || 0;
            const moduleDuration = Math.floor(sectionDuration / moduleCount);
            
            // Try to get actual modules if available
            let modules = section.modules || [];
            
            // If no modules array, create placeholder based on moduleCount
            if (modules.length === 0 && moduleCount > 0) {
              modules = Array.from({ length: moduleCount }, (_, i) => ({
                moduleNumber: i + 1,
                questionCount: section.type === "ENGLISH" ? 27 : 22, // Default question counts
                duration: moduleDuration,
              }));
            }
            
            return {
              sectionType: section.sectionType || section.type,
              duration: section.duration,
              allowCalculator: section.allowCalculator ?? (section.type === "MATH"),
              modules: modules.map((mod: any) => ({
                moduleNumber: mod.moduleNumber || mod.module_number || 1,
                questionCount: mod.questionCount || mod.question_count || mod.totalQuestions || (section.type === "ENGLISH" ? 27 : 22),
                duration: mod.duration || moduleDuration,
              })),
            };
          }),
        };
      }
      
      // Fallback: return test as is with isActive default
      return {
        ...test,
        isActive: test.isActive ?? true,
      };
    }) : [];

    return NextResponse.json(transformedTests, { status: 200 });
  } catch (error) {
    console.error("[Practice Tests API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        message: "Failed to fetch tests", 
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

