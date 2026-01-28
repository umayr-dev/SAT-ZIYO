"use client";

import { useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { Button } from "@/src/ui/button";
import { Textarea } from "@/src/ui/textarea";
import { Send } from "lucide-react";

export interface Comment {
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

interface CommentFormProps {
  testId: string;
  parentId?: string;
  onCommentCreated: (comment: Comment) => void;
  placeholder?: string;
  onCancel?: () => void;
}

export function CommentForm({
  testId,
  parentId,
  onCommentCreated,
  placeholder = "Write a comment...",
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (content.length > 2000) {
      setError("Comment must be less than 2000 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let newComment: Comment;
      if (parentId) {
        newComment = await practiceService.replyToComment(
          parentId,
          content.trim(),
        );
      } else {
        newComment = await practiceService.createComment(
          testId,
          content.trim(),
        );
      }

      setContent("");
      onCommentCreated(newComment);
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error("Failed to create comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError(null);
        }}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="resize-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {content.length}/2000 characters
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !content.trim()}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
