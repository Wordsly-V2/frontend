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
import type { ResetDescription } from "@/lib/admin/learners";
import { Check, Trash2 } from "lucide-react";

/** Confirm a learner reset, listing exactly what goes and what stays. */
export function ResetDialog({
    title,
    reset,
    onClose,
    onConfirm,
    isLoading,
}: Readonly<{
    title: string;
    reset: ResetDescription;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}>) {
    return (
        <AlertDialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
            <AlertDialogContent className="max-w-lg sm:mx-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">{title}</AlertDialogTitle>
                    <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 text-sm">
                    <ResetList label="Removed" items={reset.removes} icon={<Trash2 className="h-4 w-4 text-destructive" />} />
                    <ResetList label="Kept" items={reset.keeps} icon={<Check className="h-4 w-4 text-muted-foreground" />} />
                </div>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel disabled={isLoading} className="w-full text-sm sm:w-auto">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="w-full bg-destructive text-sm hover:bg-destructive/90 sm:w-auto"
                    >
                        {isLoading ? "Resetting…" : `Reset ${reset.name}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ResetList({ label, items, icon }: Readonly<{ label: string; items: string[]; icon: React.ReactNode }>) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <ul className="space-y-1.5">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <span className="mt-0.5 shrink-0">{icon}</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
