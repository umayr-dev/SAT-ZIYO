"use client";

import { useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { CommentForm } from "./CommentForm";
import { ReplyThread } from "./ReplyThread";
import { Button } from "@/src/ui/button";
import { MoreVertical, Edit2, Trash2, Reply, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/ui/dropdown-menu";
import { useCurrentUser } from "@/src/hooks/use-auth";
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

interface CommentItemProps {
  comment: Comment;
  onDeleted: (commentId: string) => void;
  onUpdated: (commentId: string, content: string) => void;
}

export function CommentItem({
  comment,
  onDeleted,
  onUpdated,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const isOwner = currentUser?.id === comment.user.id;

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this comment? All replies will also be deleted.",
      )
    ) {
      return;
    }

    try {
      await practiceService.deleteComment(comment.id);
      onDeleted(comment.id);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length > 2000) {
      return;
    }

    try {
      setSubmitting(true);
      await practiceService.editComment(comment.id, editContent.trim());
      onUpdated(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to edit comment:", err);
      alert("Failed to edit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-gray-600">
            {comment.user.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {comment.user.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt))}
              {comment.isEdited && " (edited)"}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={submitting || !editContent.trim()}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs text-gray-600 hover:text-gray-900">
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Replies & reply form (managed inside thread) */}
          <div className="mt-3">
            <ReplyThread commentId={comment.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
