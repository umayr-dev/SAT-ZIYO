"use client";

import { useEffect, useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/src/hooks/use-auth";

interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  replyCount: number;
}

interface CommentsSectionProps {
  testId: string;
}

export function CommentsSection({ testId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const { data: currentUser } = useCurrentUser();

  const loadComments = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await practiceService.getTestComments(testId, pageNum, 20);
      if (pageNum === 1) {
        setComments(response.data);
      } else {
        setComments((prev) => [...prev, ...response.data]);
      }
      setHasMore(pageNum < response.meta.totalPages);
      setTotalPages(response.meta.totalPages);
      setError(null);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      loadComments(1);
    }
  }, [testId]);

  const handleCommentCreated = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleCommentUpdated = (commentId: string, content: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, content, isEdited: true, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadComments(nextPage);
    }
  };

  return (
    <Card className="bg-white shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {currentUser && (
          <CommentForm testId={testId} onCommentCreated={handleCommentCreated} />
        )}

        {/* Comments List */}
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDeleted={handleCommentDeleted}
                  onUpdated={handleCommentUpdated}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more comments"}
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

