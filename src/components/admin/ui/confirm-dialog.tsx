"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Xác nhận thao tác",
  description = "Hành động này không thể hoàn tác.",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const confirmColor =
    variant === "danger" ? "#EF4444" :
    variant === "warning" ? "#F59E0B" :
    "#8B5CF6";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: confirmColor }} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="text-white"
            style={{
              background: variant === "danger" ? "#EF4444" :
                          variant === "warning" ? "#F59E0B" :
                          "linear-gradient(135deg, #8B5CF6, #6366F1)",
              border: "none",
            }}
          >
            {isLoading && <Loader2 size={14} className="animate-spin mr-2" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
