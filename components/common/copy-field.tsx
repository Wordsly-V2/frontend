"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CopyFieldProps {
    /** The text to show and copy. */
    value: string;
    /** Accessible label for the copy button (defaults to "Copy"). */
    copyLabel?: string;
    /** Toast shown after a successful copy. */
    successMessage?: string;
    className?: string;
}

/**
 * Read-only monospace text with a copy button — for values that can't be links
 * (internal browser URLs, tokens, commands). The text stays selectable so it
 * still works when the clipboard API is unavailable (non-HTTPS origins).
 */
export function CopyField({
    value,
    copyLabel = "Copy",
    successMessage = "Copied",
    className,
}: CopyFieldProps) {
    const [copied, setCopied] = useState(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (resetTimer.current) clearTimeout(resetTimer.current);
        },
        [],
    );

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(successMessage);
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn’t copy — select the text and copy it manually.");
        }
    }, [successMessage, value]);

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2 pl-3",
                className,
            )}
        >
            <code className="min-w-0 flex-1 select-all truncate font-mono text-sm text-foreground">
                {value}
            </code>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                aria-label={`${copyLabel}: ${value}`}
            >
                {copied ? (
                    <Check className="h-4 w-4 text-[var(--brand-success)]" aria-hidden />
                ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? "Copied" : copyLabel}
            </Button>
        </div>
    );
}
