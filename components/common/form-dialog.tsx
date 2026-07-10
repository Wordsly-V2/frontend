"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ReactNode } from "react";

/**
 * Shared scaffold for the manage CRUD dialogs: the Dialog shell, a `<form>`, a
 * title, and a Cancel/Submit footer with a loading state. Callers own the form
 * state (react-hook-form) and pass the already-wrapped `onSubmit` handler and
 * the fields as children — this removes the open/submit/footer boilerplate each
 * dialog used to re-implement.
 */
export interface FormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** Already wrapped with react-hook-form's handleSubmit. */
    onSubmit: () => void;
    children: ReactNode;
    submitLabel: string;
    isLoading?: boolean;
    submitDisabled?: boolean;
    contentClassName?: string;
}

export function FormDialog({
    isOpen,
    onClose,
    title,
    onSubmit,
    children,
    submitLabel,
    isLoading = false,
    submitDisabled = false,
    contentClassName = "max-w-md max-h-[85dvh] overflow-y-auto sm:mx-auto",
}: Readonly<FormDialogProps>) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={contentClassName}>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">{children}</div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full sm:w-auto text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || submitDisabled}
                            className="w-full sm:w-auto text-sm"
                        >
                            {isLoading ? <LoadingSpinner size="sm" /> : submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
