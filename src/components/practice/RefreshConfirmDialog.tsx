"use client";

import { memo } from "react";
import { Button } from "@/src/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/ui/dialog";

export interface RefreshConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onSaveAndExit: () => void;
}

export const RefreshConfirmDialog = memo(function RefreshConfirmDialog({
  open,
  onOpenChange,
  onContinue,
  onSaveAndExit,
}: RefreshConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Refresh the page?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          If you refresh, you will leave the test. You can continue without
          refreshing.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onContinue}>
            Continue
          </Button>
          <Button variant="default" onClick={onSaveAndExit}>
            Save and Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
