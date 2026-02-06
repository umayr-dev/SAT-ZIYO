"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Loading } from "@/src/ui/loading";
import { adminTestService } from "@/src/services/admin-test.service";

interface Section {
  sectionType: "ENGLISH" | "MATH";
  orderIndex: number;
  duration: number;
  allowCalculator: boolean;
  breakDurationAfter: number;
  modules: Module[];
}

interface Module {
  moduleNumber: 1 | 2;
  difficulty: "EASY" | "HARD";
  questionCount: number;
  duration: number;
  questions: Question[];
}

interface Question {
  questionText: string;
  orderIndex: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  choices: Choice[];
}

interface Choice {
  choiceText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creationMode] = useState<"full">("full");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const simpleSections: Section[] = [
        {
          sectionType: "ENGLISH",
          orderIndex: 0,
          duration: 64,
          allowCalculator: false,
          breakDurationAfter: 10,
          modules: [
            {
              moduleNumber: 1,
              difficulty: "EASY",
              questionCount: 27,
              duration: 32,
              questions: [],
            },
            {
              moduleNumber: 2,
              difficulty: "EASY",
              questionCount: 27,
              duration: 32,
              questions: [],
            },
          ],
        },
        {
          sectionType: "MATH",
          orderIndex: 1,
          duration: 70,
          allowCalculator: true,
          breakDurationAfter: 0,
          modules: [
            {
              moduleNumber: 1,
              difficulty: "EASY",
              questionCount: 22,
              duration: 35,
              questions: [],
            },
            {
              moduleNumber: 2,
              difficulty: "EASY",
              questionCount: 22,
              duration: 35,
              questions: [],
            },
          ],
        },
      ];

      const result = await adminTestService.createTest({
        title,
        description,
        sections: simpleSections,
      });
      setSuccess("Test created successfully! You can now add questions.");
      setTimeout(() => {
        router.push(`/admin/tests/${result.id}/questions`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create SAT Test
        </h2>
        <p className="text-gray-600 max-w-2xl">
          Just give the test a name. We will automatically create the standard
          SAT structure (English + Math, 2 modules each). You can add questions
          on the next step.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="SAT Practice Test 1"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full-length Digital SAT practice test"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-900 font-semibold">
              What will be created?
            </p>
            <p className="text-sm text-blue-800">
              - 1 English section (2 modules, 27 questions each) <br />- 1 Math
              section (2 modules, 22 questions each) <br />- 10-minute break
              between English and Math
            </p>
            <p className="text-xs text-blue-700">
              After you create the test, you&apos;ll go to the next page to add
              or import questions for each module.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Test"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
