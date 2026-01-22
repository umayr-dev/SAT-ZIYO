"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  adminTestService,
  TestValidation,
} from "@/src/services/admin-test.service";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function TestValidationPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [mounted, setMounted] = useState(false);
  const [validation, setValidation] = useState<TestValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (testId) {
      loadValidation();
    }
  }, [testId]);

  async function loadValidation() {
    try {
      setLoading(true);
      const result = await adminTestService.validateTest(testId);
      setValidation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load validation");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-red-700">{error || "Validation not found"}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/tests")}
            className="mt-4"
          >
            Back to Tests
          </Button>
        </Card>
      </div>
    );
  }

  const issues = validation.issues ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Test Validation: {validation.title}
        </h2>
        <p className="text-gray-600">
          Check if the test is complete and ready for students
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {validation.isValid ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-xl font-semibold text-green-700">
                  Test is Valid
                </h3>
                <p className="text-green-600">
                  All modules have the required number of questions
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="text-xl font-semibold text-red-700">
                  Test is Incomplete
                </h3>
                <p className="text-red-600">
                  Some modules are missing questions
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {validation.isReadyForStudents ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Ready for Students</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Not Ready for Students</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Module Status
        </h3>
        <div className="space-y-4">
          {validation.modules.map((module, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                module.isComplete
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {module.sectionType} - Module {module.moduleNumber} (
                    {module.difficulty})
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {module.actualQuestions} / {module.expectedQuestions}{" "}
                    questions
                  </div>
                </div>
                <div>
                  {module.isComplete ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
              {!module.isComplete && (
                <div className="mt-2 text-sm text-red-700">
                  Missing {module.expectedQuestions - module.actualQuestions}{" "}
                  questions
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {issues.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Issues to Fix
          </h3>
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={() => router.push(`/admin/tests/${testId}/questions`)}
        >
          Add Questions
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/tests")}>
          Back to Tests
        </Button>
        <Button variant="outline" onClick={loadValidation}>
          Refresh Validation
        </Button>
      </div>
    </div>
  );
}


