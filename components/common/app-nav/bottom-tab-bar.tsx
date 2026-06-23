"use client";

import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Dumbbell, Library, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
    href: string;
    label: string;
    icon: typeof BookOpen;
    match: (path: string) => boolean;
};

const TABS: Tab[] = [
    {
        href: "/learn",
        label: "Learn",
        icon: BookOpen,
        match: (p) => p === "/learn",
    },
    {
        href: "/learn/courses",
        label: "Courses",
        icon: Library,
        match: (p) => p.startsWith("/learn/courses"),
    },
    {
        href: "/progress",
        label: "Progress",
        icon: BarChart3,
        match: (p) => p.startsWith("/progress"),
    },
    {
        href: "/manage",
        label: "Manage",
        icon: Settings,
        match: (p) => p.startsWith("/manage"),
    },
    {
        href: "/profile",
        label: "Profile",
        icon: User,
        match: (p) => p.startsWith("/profile"),
    },
];

export function BottomTabBar() {
    const pathname = usePathname() ?? "";
    const { profile } = useUser();
    const next = useNextPracticeAction();

    // Hidden when logged out, on auth, and during the immersive practice flow.
    const hidden =
        !profile ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/learn/practice");

    if (hidden) return null;

    const practiceHref = next.primary?.href ?? "/learn";
    const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

    return (
        <>
            {/* In-flow spacer so page content isn't hidden behind the fixed bar.
                Renders only when the bar is visible (mobile, logged in). */}
            <div
                aria-hidden
                className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:hidden"
            />
            <nav
                aria-label="Primary"
                className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 pb-safe backdrop-blur-xl sm:hidden"
            >
                <div className="mx-auto grid max-w-md grid-cols-6 items-end px-2 py-1.5">
                    {left.map((tab) => (
                        <TabButton key={tab.href} tab={tab} pathname={pathname} />
                    ))}

                    {/* Raised center Practice CTA */}
                    <div className="flex justify-center">
                        <Link
                            href={practiceHref}
                            aria-label="Start practice"
                            className="-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full gradient-brand text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
                        >
                            <Dumbbell className="h-6 w-6" />
                        </Link>
                    </div>

                    {right.map((tab) => (
                        <TabButton key={tab.href} tab={tab} pathname={pathname} />
                    ))}
                </div>
            </nav>
        </>
    );
}

function TabButton({ tab, pathname }: { tab: Tab; pathname: string }) {
    const active = tab.match(pathname);
    const Icon = tab.icon;
    return (
        <Link
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
        </Link>
    );
}
