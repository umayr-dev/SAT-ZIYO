"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Loading } from "@/src/ui/loading";
import { adminTestService } from "@/src/services/admin-test.service";
import { FileText } from "lucide-react";

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
          Create New Test
        </h2>
        <p className="text-gray-600">Create a new SAT practice test</p>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Full Test Structure
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Creates a standard SAT test with 2 modules per section:
            </p>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>English Section (64 minutes):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Module 1: 27 questions - 32 minutes</li>
                  <li>Module 2: 27 questions - 32 minutes</li>
                </ul>
              </div>
              <div className="mt-2">
                <strong>10-minute break</strong>
              </div>
              <div>
                <strong>Math Section (70 minutes):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Module 1: 22 questions - 35 minutes</li>
                  <li>Module 2: 22 questions - 35 minutes</li>
                </ul>
              </div>
              <div className="mt-2 font-semibold">
                Total: 98 questions across 4 modules
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-3">
              After creation, you&apos;ll be redirected to add questions to each
              module.
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


