"use client";

import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Dumbbell, Library, Settings, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
            {/* In-flow spacer so page content isn't hidden behind the floating bar.
                Renders only when the bar is visible (mobile, logged in). */}
            <div
                aria-hidden
                className="h-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:hidden"
            />
            <nav
                aria-label="Primary"
                className="fixed inset-x-3 bottom-keyboard-safe z-40 sm:hidden"
            >
                <div className="glass-surface mx-auto grid max-w-md grid-cols-6 items-end rounded-3xl px-2 py-1.5 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.3)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]">
                    {left.map((tab) => (
                        <TabButton key={tab.href} tab={tab} pathname={pathname} />
                    ))}

                    {/* Raised center Practice CTA */}
                    <div className="flex justify-center">
                        <Link
                            href={practiceHref}
                            aria-label="Start practice"
                            className="-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full gradient-brand glow-primary text-primary-foreground ring-2 ring-white/25 transition-transform active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
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
    const reduceMotion = useReducedMotion();
    return (
        <Link
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground",
            )}
        >
            {active && (
                <motion.span
                    layoutId="bottom-tab-active"
                    aria-hidden
                    transition={
                        reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 400, damping: 32 }
                    }
                    className="absolute inset-x-1 inset-y-0.5 rounded-2xl bg-primary/12 dark:bg-primary/20"
                />
            )}
            <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
            </span>
        </Link>
    );
}
