export type TextDisplayRole = "word" | "meaning" | "sentence" | "choice" | "meta" | "example";

/** Wrap long tokens and unbroken strings without blowing layout. */
export const LONG_TEXT_WRAP =
    "break-words [overflow-wrap:anywhere] hyphens-auto min-w-0 max-w-full";

export function getLongTextTitle(text: string, minLength = 48): string | undefined {
    return text.length > minLength ? text : undefined;
}

export function getTextDisplayClasses(
    text: string,
    role: TextDisplayRole,
    scrollWhenLong = true,
): { sizeClass: string; scrollClass: string } {
    const len = text.length;
    let sizeClass = "";
    let scrollClass = "";

    switch (role) {
        case "word":
            if (len > 48) {
                sizeClass = "text-xl sm:text-2xl font-bold text-balance";
            } else if (len > 28) {
                sizeClass = "text-2xl sm:text-3xl font-bold text-balance";
            } else {
                sizeClass = "text-3xl sm:text-4xl font-bold text-balance";
            }
            break;
        case "meaning":
            if (len > 180) {
                sizeClass = "text-base sm:text-lg font-semibold";
                scrollClass = scrollWhenLong
                    ? "max-h-[28dvh] overflow-y-auto overscroll-contain pr-1"
                    : "line-clamp-6";
            } else if (len > 90) {
                sizeClass = "text-lg sm:text-xl font-bold";
            } else if (len > 45) {
                sizeClass = "text-xl sm:text-2xl font-bold";
            } else {
                sizeClass = "text-2xl font-bold";
            }
            break;
        case "sentence":
            sizeClass =
                len > 120
                    ? "text-base sm:text-lg italic leading-relaxed"
                    : "text-lg sm:text-xl italic leading-relaxed";
            if (len > 160 && scrollWhenLong) {
                scrollClass = "max-h-[24dvh] overflow-y-auto overscroll-contain pr-1";
            }
            break;
        case "choice":
            sizeClass = "text-sm sm:text-base font-normal whitespace-normal text-left";
            break;
        case "example":
            sizeClass = "text-sm sm:text-base";
            if (len > 120 && scrollWhenLong) {
                scrollClass = "max-h-[20dvh] overflow-y-auto overscroll-contain pr-1";
            }
            break;
        case "meta":
            sizeClass = "text-sm sm:text-base";
            break;
    }

    return { sizeClass, scrollClass };
}

/** Scroll region for stacked intro / detail content. */
export const SCROLLABLE_BODY =
    "flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1";

export const VIEWPORT_CARD_MAX =
    "max-h-[min(88dvh,820px)]";

export const VIEWPORT_EXERCISE_MAX =
    "max-h-[min(62dvh,580px)]";
