"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    isLoading?: boolean;
    /** Replaces the confirm label while `isLoading`. */
    loadingText?: string;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "default",
    isLoading = false,
    loadingText = "Đang xử lý...",
}: Readonly<ConfirmDialogProps>) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:mx-auto max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm sm:text-base">{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto text-sm">{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={`w-full sm:w-auto text-sm ${variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}`}
                    >
                        {isLoading ? loadingText : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
