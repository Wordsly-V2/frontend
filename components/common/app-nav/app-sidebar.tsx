"use client";

import { APP_NAV_ICONS, openCommandPalette } from "@/components/common/app-nav/nav-icons";
import { StreakChip } from "@/components/common/app-nav/streak-chip";
import { UserMenu } from "@/components/common/app-nav/user-menu";
import { WordslyMark } from "@/components/common/app-nav/wordsly-mark";
import { SearchWordsButton } from "@/components/common/my-words-search";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { activeAppNavKey, APP_NAV } from "@/lib/app-nav";
import { cn } from "@/lib/utils";
import { Command, Dumbbell, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface AppSidebarProps {
    collapsed: boolean;
    /** False where the sidebar is folded by the page (admin), not by the learner. */
    canToggle: boolean;
    onToggle: () => void;
}

/**
 * The desktop frame (lg and up): brand, the one Practice button, the sections,
 * and the learner's streak and account at the bottom. Folds down to an icon
 * rail; widths come from `--app-sidebar-w`, set by `AppShell`.
 */
export function AppSidebar({ collapsed, canToggle, onToggle }: Readonly<AppSidebarProps>) {
    const pathname = usePathname() ?? "";
    const active = activeAppNavKey(pathname);
    const reduceMotion = useReducedMotion();
    const next = useNextPracticeAction();
    const practiceHref = next.primary?.href ?? "/learn";
    const waiting = next.dueCount + next.newCount;

    return (
        <aside
            aria-label="App"
            className="fixed inset-y-0 left-0 z-40 hidden w-[var(--app-sidebar-w)] flex-col border-r border-sidebar-border/80 bg-sidebar/85 backdrop-blur-xl transition-[width] duration-200 motion-reduce:transition-none lg:flex"
        >
            <div className={cn("flex h-16 shrink-0 items-center gap-2", collapsed ? "justify-center px-2" : "px-4")}>
                <Link
                    href="/learn"
                    aria-label="Wordsly home"
                    className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <WordslyMark />
                    {!collapsed && (
                        <span className="truncate font-display text-xl font-extrabold tracking-tight text-gradient-brand">
                            Wordsly
                        </span>
                    )}
                </Link>
                {canToggle && !collapsed && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Collapse sidebar"
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className={cn("space-y-2", collapsed ? "px-3" : "px-4")}>
                <RailTip label={waiting > 0 ? `Practice · ${waiting} waiting` : "Practice"} show={collapsed}>
                    <Link
                        href={practiceHref}
                        className={cn(
                            "group flex h-12 items-center rounded-2xl border-b-4 border-[var(--primary-shadow)] bg-primary font-extrabold text-primary-foreground transition-[filter,transform] hover:brightness-105 active:translate-y-[2px] active:border-b-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:active:translate-y-0",
                            collapsed ? "justify-center" : "gap-2.5 px-4",
                        )}
                    >
                        <Dumbbell className="h-5 w-5 shrink-0" aria-hidden />
                        {!collapsed && <span className="text-sm uppercase tracking-wide">Practice</span>}
                        {!collapsed && waiting > 0 && (
                            <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
                                {waiting}
                            </span>
                        )}
                    </Link>
                </RailTip>
                {!collapsed && <SearchWordsButton variant="row" />}
            </div>

            <nav aria-label="Main" className={cn("mt-5 flex-1 space-y-1 overflow-y-auto", collapsed ? "px-3" : "px-3")}>
                {APP_NAV.map((item) => {
                    const Icon = APP_NAV_ICONS[item.key];
                    const isActive = item.key === active;
                    return (
                        <RailTip key={item.key} label={item.label} show={collapsed}>
                            <Link
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "relative flex h-11 items-center rounded-xl text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    collapsed ? "justify-center" : "gap-3 px-3",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                                )}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="app-sidebar-active"
                                        aria-hidden
                                        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                                        className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10"
                                    />
                                )}
                                <Icon className="relative h-5 w-5 shrink-0" aria-hidden />
                                {!collapsed && <span className="relative truncate">{item.label}</span>}
                            </Link>
                        </RailTip>
                    );
                })}
            </nav>

            <div className={cn("shrink-0 space-y-2 pb-4 pt-3", collapsed ? "flex flex-col items-center px-2" : "px-3")}>
                {collapsed ? (
                    <>
                        <StreakChip side="right" />
                        <RailTip label="Search your words" show>
                            <SearchWordsButton />
                        </RailTip>
                        <RailTip label="Go to… (⌘K)" show>
                            <button
                                type="button"
                                onClick={openCommandPalette}
                                aria-label="Open command palette"
                                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Command className="h-5 w-5" />
                            </button>
                        </RailTip>
                        {canToggle && (
                            <RailTip label="Expand sidebar" show>
                                <button
                                    type="button"
                                    onClick={onToggle}
                                    aria-label="Expand sidebar"
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <PanelLeftOpen className="h-5 w-5" />
                                </button>
                            </RailTip>
                        )}
                        <UserMenu side="right" />
                    </>
                ) : (
                    <>
                        <StreakChip variant="panel" side="right" />
                        <button
                            type="button"
                            onClick={openCommandPalette}
                            className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Command className="h-4 w-4" aria-hidden />
                            Go to…
                            <kbd className="ml-auto rounded-md border border-border/80 bg-muted/80 px-1.5 font-mono text-[10px] font-medium">
                                ⌘K
                            </kbd>
                        </button>
                        <UserMenu variant="row" side="right" />
                    </>
                )}
            </div>
        </aside>
    );
}

/** A tooltip to the right, only while the sidebar is an icon rail. */
function RailTip({ label, show, children }: Readonly<{ label: string; show: boolean; children: ReactNode }>) {
    if (!show) return <>{children}</>;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
