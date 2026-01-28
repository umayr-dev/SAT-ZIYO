"use client";

import { useEffect, useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { CommentForm } from "./CommentForm";
import { Button } from "@/src/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
// Simple date formatting function
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

interface Reply {
  id: string;
  content: string;
  parentId: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  replyCount: number;
}

interface ReplyThreadProps {
  commentId: string;
}

export function ReplyThread({ commentId }: ReplyThreadProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const response = await practiceService.getCommentReplies(commentId, 1, 20);
      setReplies(response.data);
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && replies.length === 0) {
      loadReplies();
    }
  }, [expanded, commentId]);

  const handleReplyCreated = (newReply: Reply) => {
    setReplies((prev) => [...prev, newReply]);
    setShowReplyForm(false);
  };

  if (replies.length === 0 && !expanded) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Hide replies
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </>
        )}
      </button>

      {expanded && (
        <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
          {loading ? (
            <div className="text-xs text-gray-500">Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="text-xs text-gray-500">No replies yet</div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600">
                    {reply.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-xs">
                      {reply.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reply.createdAt))}
                      {reply.isEdited && " (edited)"}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>
              </div>
            ))
          )}

          {!showReplyForm && (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Reply
            </button>
          )}

          {showReplyForm && (
            <CommentForm
              testId=""
              parentId={commentId}
              onCommentCreated={handleReplyCreated}
              placeholder="Write a reply..."
              onCancel={() => setShowReplyForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

