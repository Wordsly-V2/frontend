"use client";

import { Loader2 } from "lucide-react";

interface SavingOverlayProps {
    open: boolean;
    message?: string;
}

export function SavingOverlay({
    open,
    message = "Saving your progress…",
}: Readonly<SavingOverlayProps>) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-6 shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <p className="text-sm font-medium text-foreground">{message}</p>
                <p className="text-xs text-muted-foreground">Almost done — please stay on this page.</p>
            </div>
        </div>
    );
}
