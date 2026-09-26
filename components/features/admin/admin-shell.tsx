"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeAdminHref, ADMIN_NAV } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";
import { LayoutDashboard, type LucideIcon, Menu, Route, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ICONS: Record<string, LucideIcon> = {
    "/admin": LayoutDashboard,
    "/admin/users": Users,
    "/admin/path": Route,
};

/**
 * The admin area's frame: a sidebar on desktop, a menu sheet on mobile. Pages
 * keep their own `<main>` and padding, so they render the same inside it.
 */
export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const active = activeAdminHref(pathname);
    const activeLabel = ADMIN_NAV.flatMap((group) => group.links).find((link) => link.href === active)?.label;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="mx-auto flex w-full max-w-7xl md:gap-2 md:px-4">
            <aside className="hidden w-56 shrink-0 md:block">
                <div className="sticky top-24 pt-10">
                    <AdminNav active={active} />
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                <div className="px-4 pt-4 md:hidden">
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-full">
                                <Menu className="h-4 w-4" />
                                Admin{activeLabel ? ` · ${activeLabel}` : ""}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72">
                            <SheetHeader>
                                <SheetTitle>Admin</SheetTitle>
                                <SheetDescription>Manage people and content.</SheetDescription>
                            </SheetHeader>
                            <div className="px-3">
                                <AdminNav active={active} onNavigate={() => setMenuOpen(false)} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                {children}
            </div>
        </div>
    );
}

function AdminNav({ active, onNavigate }: Readonly<{ active: string | null; onNavigate?: () => void }>) {
    return (
        <nav aria-label="Admin" className="space-y-5">
            <p className="hidden items-center gap-2 px-3 text-sm font-semibold md:flex">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin
            </p>
            {ADMIN_NAV.map((group) => (
                <div key={group.heading} className="space-y-1">
                    <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group.heading}
                    </p>
                    {group.links.map(({ href, label }) => {
                        const Icon = ICONS[href] ?? ShieldCheck;
                        const isActive = href === active;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigate}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-primary/10 font-semibold text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}
