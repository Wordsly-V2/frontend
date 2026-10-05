"use client";

import { APP_NAV_ICONS } from "@/components/common/app-nav/nav-icons";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { activeAppNavKey, APP_NAV, type AppNavItem } from "@/lib/app-nav";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = APP_NAV.filter((item) => item.inTabBar);

/**
 * The mobile section bar (below lg), docked to the bottom edge: two sections,
 * the Practice button, two sections. Only rendered inside the app frame, so it
 * is already absent from sessions, lessons and tests.
 */
export function BottomTabBar() {
    const pathname = usePathname() ?? "";
    const active = activeAppNavKey(pathname);
    const next = useNextPracticeAction();
    const practiceHref = next.primary?.href ?? "/learn";
    const waiting = next.dueCount + next.newCount;
    const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

    return (
        <>
            {/* In-flow spacer so the end of the page clears the docked bar. */}
            <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:hidden" />
            <nav
                aria-label="Primary"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-safe backdrop-blur-xl lg:hidden"
            >
                <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
                    {left.map((tab) => (
                        <TabLink key={tab.key} tab={tab} active={tab.key === active} />
                    ))}

                    <Link
                        href={practiceHref}
                        aria-label={waiting > 0 ? `Practice, ${waiting} words waiting` : "Practice"}
                        className="group flex flex-col items-center justify-center gap-0.5 focus-visible:outline-none"
                    >
                        <span className="relative flex h-10 w-14 items-center justify-center rounded-2xl border-b-[3px] border-[var(--primary-shadow)] bg-primary text-primary-foreground transition-transform group-active:translate-y-[2px] group-active:border-b group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50 motion-reduce:group-active:translate-y-0">
                            <Dumbbell className="h-5 w-5" aria-hidden />
                            {waiting > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border-2 border-background bg-[var(--brand-orange)] px-1 text-center text-[10px] font-extrabold leading-4 text-white tabular-nums">
                                    {waiting > 99 ? "99+" : waiting}
                                </span>
                            )}
                        </span>
                        <span className="text-[10px] font-bold text-primary">Practice</span>
                    </Link>

                    {right.map((tab) => (
                        <TabLink key={tab.key} tab={tab} active={tab.key === active} />
                    ))}
                </div>
            </nav>
        </>
    );
}

function TabLink({ tab, active }: Readonly<{ tab: AppNavItem; active: boolean }>) {
    const Icon = APP_NAV_ICONS[tab.key];
    return (
        <Link
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground",
            )}
        >
            <span
                className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/12 dark:bg-primary/20",
                )}
            >
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            {tab.label}
        </Link>
    );
}
