"use client";

import { StreakChip } from "@/components/common/app-nav/streak-chip";
import { UserMenu } from "@/components/common/app-nav/user-menu";
import { WordslyMark } from "@/components/common/app-nav/wordsly-mark";
import { SearchWordsButton } from "@/components/common/my-words-search";
import { activeAppNavKey, APP_NAV } from "@/lib/app-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The mobile frame's top (below lg): where you are, search, streak and the
 * account menu. Sections live in the bottom tab bar; Manage and the command
 * palette live in the account menu.
 */
export function MobileTopBar() {
    const pathname = usePathname() ?? "";
    const active = activeAppNavKey(pathname);
    const title = APP_NAV.find((item) => item.key === active)?.label ?? "Wordsly";

    return (
        <header className="border-b border-border/60 bg-background/85 pt-safe backdrop-blur-xl lg:hidden">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
                <Link
                    href="/learn"
                    aria-label="Wordsly home"
                    className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <WordslyMark className="h-8 w-8 rounded-lg" />
                </Link>
                <p className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-tight">
                    {title}
                </p>
                <SearchWordsButton />
                <StreakChip />
                <UserMenu withAppLinks className="ml-1" />
            </div>
        </header>
    );
}
