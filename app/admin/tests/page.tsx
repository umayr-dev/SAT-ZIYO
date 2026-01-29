"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { adminTestService } from "@/src/services/admin-test.service";
import { TestEditModal } from "@/src/components/admin/TestEditModal";
import {
  useAdminTests,
  useAdminTestInvalidate,
} from "@/src/hooks/use-admin-tests";
import {
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Info,
  Trash2,
} from "lucide-react";

interface Test {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TestsPage() {
  const router = useRouter();
  const {
    data: tests = [],
    isLoading: loading,
    error: queryError,
  } = useAdminTests();
  const { invalidateList } = useAdminTestInvalidate();
  const [error, setError] = useState("");
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const displayError = queryError ? (queryError as Error).message : error;

  async function handleUpdateTest(
    testId: string,
    updates: Partial<Test>,
  ): Promise<void> {
    await adminTestService.updateTest(testId, updates);
    await invalidateList();
  }

  async function handleDeleteTest(testId: string): Promise<void> {
    if (
      !confirm(
        "Are you sure you want to delete this test? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      setError("");
      await adminTestService.deleteTest(testId);
      await invalidateList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete test");
    }
  }

  const handleEditClick = (test: Test) => {
    setSelectedTest(test);
    setIsEditModalOpen(true);
  };

  const handleAddQuestionsClick = (testId: string) => {
    // Open questions page in modal or navigate
    // For now, navigate to questions page
    // Later we can add modal support
    router.push(`/admin/tests/${testId}/questions`);
  };

  const toggleExpand = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tests</h2>
          <p className="text-gray-600">Manage practice tests</p>
        </div>
        <Button onClick={() => router.push("/admin/tests/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Test
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      ) : (tests as Test[]).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No tests found</p>
          <Button onClick={() => router.push("/admin/tests/create")}>
            Create Your First Test
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(tests as Test[]).map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <Card
                key={test.id}
                className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-2">
                      {test.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Status and Date */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          test.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {test.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddQuestionsClick(test.id)}
                        className="flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Questions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(test)}
                        className="flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/tests/${test.id}/validate`)
                        }
                        className="flex items-center justify-center gap-1 relative group"
                        title="Validate test structure - checks if all modules have required questions and test is ready for students"
                      >
                        <FileText className="w-3 h-3" />
                        Validate
                        <Info className="w-3 h-3 ml-1 text-gray-400 group-hover:text-gray-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(test.id)}
                        className="flex items-center justify-center gap-1"
                      >
                        {isExpanded ? "Less" : "More"}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTest(test.id)}
                      className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Test
                    </Button>
                  </div>

                  {/* Expanded Info */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{new Date(test.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Updated:</span>
                        <span>{new Date(test.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-blue-900 mb-1">
                              Validate Test - Nima qiladi?
                            </p>
                            <div className="text-xs text-blue-800 space-y-1">
                              <p>
                                <strong>Maqsad:</strong> Test to&apos;liq va
                                studentlar uchun tayyor ekanligini tekshirish
                              </p>
                              <p>
                                <strong>Nima tekshiradi:</strong>
                              </p>
                              <ul className="list-disc list-inside ml-2 space-y-0.5">
                                <li>
                                  Har bir modulda kerakli miqdordagi savollar
                                  bor-yo&apos;qligi
                                </li>
                                <li>
                                  Test strukturasining to&apos;g&apos;riligi
                                </li>
                                <li>Barcha modullar to&apos;liq ekanligi</li>
                                <li>Test studentlar uchun tayyor ekanligi</li>
                              </ul>
                              <p className="mt-2">
                                <strong>Natija:</strong> Agar barcha modullar
                                to&apos;liq bo&apos;lsa, test &quot;Ready for
                                Students&quot; deb belgilanadi va studentlar uni
                                ishlay olishadi.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <TestEditModal
        test={selectedTest}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTest(null);
        }}
        onUpdate={handleUpdateTest}
      />
    </div>
  );
}
