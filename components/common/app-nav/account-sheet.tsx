"use client";

import { LogoutDialog } from "@/components/common/app-nav/logout-dialog";
import { APP_NAV_ICONS } from "@/components/common/app-nav/nav-icons";
import { UserAvatar } from "@/components/common/app-nav/user-menu";
import { ChangeThemeToggle } from "@/components/common/change-theme-toggle/change-theme-toggle";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@/hooks/useUser.hook";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { ChevronRight, LogOut, type LucideIcon, ShieldCheck, TriangleAlert, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";

interface SheetLink {
    href: string;
    label: string;
    detail: string;
    icon: LucideIcon;
}

/** The pages the tab bar has no room for. */
const WORD_LINKS: readonly SheetLink[] = [
    {
        href: "/manage",
        label: "Manage words",
        detail: "Add and edit your courses and words",
        icon: APP_NAV_ICONS.manage,
    },
    {
        href: "/learn/difficult",
        label: "Difficult words",
        detail: "Words you saved or keep missing",
        icon: TriangleAlert,
    },
];

const PROFILE_LINK: SheetLink = {
    href: "/profile",
    label: "Profile",
    detail: "Your account and app settings",
    icon: User,
};

const ADMIN_LINK: SheetLink = {
    href: "/admin",
    label: "Admin",
    detail: "Users, reports and content",
    icon: ShieldCheck,
};

/**
 * The mobile account menu (below lg): the avatar opens a sheet from the bottom
 * with the pages the tab bar leaves out (Manage, Difficult words), the account
 * links, theme and sign out. The sidebar keeps the dropdown `UserMenu`.
 */
export function AccountSheet({ className }: Readonly<{ className?: string }>) {
    const pathname = usePathname() ?? "";
    const { profile } = useUser();
    const [open, setOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    // The logout dialog waits for the sheet to finish closing, so the two
    // Radix dialogs never fight over focus and pointer locking.
    const logoutAfterClose = useRef(false);

    if (!profile) return null;

    const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        aria-label="Account menu"
                        className={cn(
                            "rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-shadow hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-ring",
                            className,
                        )}
                    >
                        <UserAvatar profile={profile} />
                    </button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl px-3 pb-safe lg:hidden"
                    onCloseAutoFocus={(event) => {
                        if (!logoutAfterClose.current) return;
                        logoutAfterClose.current = false;
                        event.preventDefault();
                        setLogoutOpen(true);
                    }}
                >
                    <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />

                    <div className="flex items-center gap-3 px-2 pb-3 pt-4 pr-10">
                        <UserAvatar profile={profile} className="h-12 w-12" />
                        <div className="min-w-0">
                            <SheetTitle className="truncate font-display text-lg font-bold leading-tight">
                                {profile.displayName}
                            </SheetTitle>
                            <SheetDescription className="truncate">{profile.gmail}</SheetDescription>
                        </div>
                    </div>

                    <SheetGroup title="Your words">
                        {WORD_LINKS.map((link) => (
                            <SheetLinkRow key={link.href} link={link} current={isCurrent(link.href)} />
                        ))}
                    </SheetGroup>

                    <SheetGroup title="Account">
                        <SheetLinkRow link={PROFILE_LINK} current={isCurrent(PROFILE_LINK.href)} />
                        {isAdmin(profile) && <SheetLinkRow link={ADMIN_LINK} current={isCurrent(ADMIN_LINK.href)} />}
                        <li className="flex min-h-14 items-center justify-between gap-3 rounded-2xl px-3 py-2">
                            <span className="font-semibold">Theme</span>
                            <ChangeThemeToggle />
                        </li>
                    </SheetGroup>

                    <div className="mb-3 mt-2 border-t border-border/70 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                logoutAfterClose.current = true;
                                setOpen(false);
                            }}
                            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <LogOut className="h-5 w-5" aria-hidden />
                            Log out
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
        </>
    );
}

function SheetGroup({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    return (
        <section className="mt-2">
            <h3 className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {title}
            </h3>
            <ul>{children}</ul>
        </section>
    );
}

function SheetLinkRow({ link, current }: Readonly<{ link: SheetLink; current: boolean }>) {
    const Icon = link.icon;
    return (
        <li>
            <SheetClose asChild>
                <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                        "flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        current && "bg-primary/10 dark:bg-primary/15",
                    )}
                >
                    <span
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted",
                            current ? "text-primary" : "text-muted-foreground",
                        )}
                    >
                        <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className={cn("block truncate font-semibold", current && "text-primary")}>
                            {link.label}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">{link.detail}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
            </SheetClose>
        </li>
    );
}
