"use client";

import { useState, useMemo, useEffect } from "react";
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
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TESTS_PER_PAGE = 6;

interface Test {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  accessType?: "FREE" | "PREMIUM";
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
  const [page, setPage] = useState(1);

  const displayError = queryError ? (queryError as Error).message : error;

  const totalTests = (tests as Test[]).length;
  const totalPages = Math.max(1, Math.ceil(totalTests / TESTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTests = useMemo(() => {
    const list = tests as Test[];
    const start = (currentPage - 1) * TESTS_PER_PAGE;
    return list.slice(start, start + TESTS_PER_PAGE);
  }, [tests, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(1);
  }, [totalPages, page]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Testlar</h2>
        <Button onClick={() => router.push("/admin/tests/create")} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          Yangi test
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
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-3">Testlar yo‘q</p>
          <Button onClick={() => router.push("/admin/tests/create")} size="sm">
            Yangi test qo‘shish
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedTests.map((test) => {
              const accessType = test.accessType === "PREMIUM" ? "PREMIUM" : "FREE";
              const accessLabel = accessType === "PREMIUM" ? "Premium" : "Free";
              const accessClasses =
                accessType === "PREMIUM"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200";

              return (
              <Card
                key={test.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 text-base leading-snug">
                      {test.title}
                    </h3>
                    {test.isActive ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                        <XCircle className="w-4 h-4 text-gray-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                        test.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {test.isActive ? "Faol" : "Nofaol"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${accessClasses}`}>
                      {accessLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddQuestionsClick(test.id)}
                      className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Savollar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(test)}
                      className="gap-1.5 border-gray-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Tahrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/tests/${test.id}/validate`)}
                      className="gap-1.5 border-gray-200"
                      title="Struktura tekshirish"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Tekshirish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTest(test.id)}
                      className="gap-1.5 text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      O‘chirish
                    </Button>
                  </div>
                </div>
              </Card>
            )})}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Oldingi
              </Button>
              <span className="text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="gap-1"
              >
                Keyingi
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
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
