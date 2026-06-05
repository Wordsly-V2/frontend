"use client";

import {
    getLongTextTitle,
    getTextDisplayClasses,
    LONG_TEXT_WRAP,
    type TextDisplayRole,
} from "@/lib/long-text";
import { cn } from "@/lib/utils";

interface AdaptiveTextProps {
    text: string;
    role: TextDisplayRole;
    as?: "p" | "h2" | "h3" | "span" | "div";
    align?: "left" | "center";
    className?: string;
    scrollWhenLong?: boolean;
}

export function AdaptiveText({
    text,
    role,
    as: Component = "p",
    align = "left",
    className,
    scrollWhenLong = true,
}: Readonly<AdaptiveTextProps>) {
    const { sizeClass, scrollClass } = getTextDisplayClasses(text, role, scrollWhenLong);

    return (
        <Component
            className={cn(
                LONG_TEXT_WRAP,
                sizeClass,
                scrollClass,
                align === "center" && "text-center mx-auto",
                className,
            )}
            title={getLongTextTitle(text)}
        >
            {text}
        </Component>
    );
}
