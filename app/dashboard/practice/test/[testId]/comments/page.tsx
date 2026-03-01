"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/src/ui/button";
import { Card } from "@/src/ui/card";
import { Loading } from "@/src/ui/loading";
import { CommentsSection } from "@/src/components/comments/CommentsSection";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function TestCommentsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Discussion</h1>
              <p className="text-gray-600">Share your thoughts and ask questions</p>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <Card className="p-6">
          <CommentsSection testId={testId} />
        </Card>
      </div>
    </div>
  );
}

