"use client";

import { useEffect, useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { CommentForm, type Comment } from "./CommentForm";
import { Button } from "@/src/ui/button";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/src/ui/alert";
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

interface Reply extends Comment {
  parentId: string;
}

interface ReplyThreadProps {
  commentId: string;
}

export function ReplyThread({ commentId }: ReplyThreadProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(
    null,
  );
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  const isAdminOrOwner =
    currentUser?.role === "ADMIN" || currentUser?.role === "OWNER";

  const loadReplies = async () => {
    try {
      setLoading(true);
      const response = await practiceService.getCommentReplies(
        commentId,
        1,
        20,
      );
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

  const handleReplyCreated = (newReply: Comment, _parentReplyId?: string) => {
    // Cast to Reply; backend replies include parentId so shape is compatible
    setReplies((prev) => [...prev, newReply as Reply]);
    setShowReplyForm(false);
    if (!expanded) {
      setExpanded(true);
    }
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;
    try {
      setDeleteError(null);
      await practiceService.deleteComment(replyToDelete);
      setReplies((prev) => prev.filter((r) => r.id !== replyToDelete));
      setDeleteDialogOpen(false);
      setReplyToDelete(null);
    } catch (err) {
      console.error("Failed to delete reply:", err);
      setDeleteError("Failed to delete reply. Please try again.");
    }
  };

  const openDeleteDialog = (replyId: string) => {
    setReplyToDelete(replyId);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReplyId || !editContent.trim() || editContent.length > 2000) {
      return;
    }
    try {
      setSubmitting(true);
      await practiceService.editComment(editingReplyId, editContent.trim());
      setReplies((prev) =>
        prev.map((r) =>
          r.id === editingReplyId
            ? {
                ...r,
                content: editContent.trim(),
                isEdited: true,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      setEditingReplyId(null);
    } catch (err) {
      console.error("Failed to edit reply:", err);
      alert("Failed to edit reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            {replies.length > 0
              ? `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
              : "Show replies"}
          </>
        )}
      </button>

      {expanded && (
        <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-3 bg-gray-50 rounded-lg py-3 pr-3">
          {loading ? (
            <div className="text-xs text-gray-500">Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="text-xs text-gray-500">No replies yet</div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                className="flex items-start gap-2 rounded-md bg-white/60 px-2 py-2 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600">
                    {reply.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-xs">
                        {reply.user.name}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {formatDistanceToNow(new Date(reply.createdAt))}
                        {reply.isEdited && " (edited)"}
                      </span>
                    </div>
                    {(currentUser?.id === reply.user.id || isAdminOrOwner) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-[11px] text-gray-500 hover:text-gray-800">
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {currentUser?.id === reply.user.id && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingReplyId(reply.id);
                                setEditContent(reply.content);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(reply.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {editingReplyId === reply.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        maxLength={2000}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={submitting || !editContent.trim()}
                          className="bg-gray-900 hover:bg-gray-800 text-xs h-7 px-3"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingReplyId(null);
                            setEditContent("");
                          }}
                          disabled={submitting}
                          className="text-xs h-7 px-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => {
                            setReplyingToReplyId(reply.id);
                            setShowReplyForm(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800"
                        >
                          <Reply className="h-3 w-3" />
                          Reply
                        </button>
                        {replyingToReplyId === reply.id && (
                          <div className="ml-2 pl-2 border-l-2 border-gray-300">
                            <CommentForm
                              testId=""
                              parentId={commentId}
                              onCommentCreated={(newReply) =>
                                handleReplyCreated(newReply, reply.id)
                              }
                              placeholder={`Reply to ${reply.user.name}...`}
                              onCancel={() => {
                                setReplyingToReplyId(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {showReplyForm && !replyingToReplyId && (
            <div className="mt-2">
              <CommentForm
                testId=""
                parentId={commentId}
                onCommentCreated={(newReply) => handleReplyCreated(newReply)}
                placeholder="Write a reply..."
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Edit Error Alert */}
          {editError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reply</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reply? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReplyToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReply}
              disabled={submitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
