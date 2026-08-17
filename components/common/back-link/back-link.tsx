"use client";

import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation.hook";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

interface BackLinkProps {
    /** Where this back button *says* it goes — and where it falls back to. */
    href: string;
    children: React.ReactNode;
    /** See `useBackNavigation`. */
    matchPrevious?: (previousPathname: string) => boolean;
    variant?: ComponentProps<typeof Button>["variant"];
    size?: ComponentProps<typeof Button>["size"];
    className?: string;
}

/**
 * The standard "← Back to X" control. A real link (so cmd-click and "open in
 * new tab" work) that prefers `history.back()` when that returns to the same
 * place, preserving the list page, filters and scroll position the learner left
 * behind.
 */
export function BackLink({
    href,
    children,
    matchPrevious,
    variant = "ghost",
    size = "sm",
    className,
}: Readonly<BackLinkProps>) {
    const { onClick } = useBackNavigation(href, { matchPrevious });

    return (
        <Button variant={variant} size={size} className={className} asChild>
            <Link href={href} onClick={onClick}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {children}
            </Link>
        </Button>
    );
}
