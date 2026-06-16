"use client";

import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useIsMobile.hook";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export type FloatingActionMenuProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    badge?: number | string;
    triggerIcon?: ReactNode;
    triggerLabel?: string;
    children: ReactNode;
    className?: string;
};

export function FloatingActionMenu({
    open,
    onOpenChange,
    title,
    description,
    badge,
    triggerIcon,
    triggerLabel = "Open actions menu",
    children,
    className,
}: Readonly<FloatingActionMenuProps>) {
    const isMobile = useIsMobile();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open || isMobile) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            onOpenChange(false);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open, isMobile, onOpenChange]);

    const panelContent = (
        <div className={cn("flex flex-col gap-3", className)}>
            {children}
        </div>
    );

    return (
        <>
            <div
                ref={menuRef}
                /* Mobile: sit above the bottom tab bar. sm+: bar is hidden, so use the normal safe-area offset. */
                className="fixed right-4 z-50 flex flex-col items-end gap-3 pointer-events-none bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-[max(0.5rem,env(safe-area-inset-bottom))]"
            >
                {!isMobile && (
                    <div
                        className={cn(
                            "pointer-events-auto w-[min(24rem,calc(100vw-2rem))] origin-bottom-right transition-all duration-200 ease-out",
                            open
                                ? "translate-y-0 scale-100 opacity-100"
                                : "pointer-events-none translate-y-2 scale-95 opacity-0",
                        )}
                        aria-hidden={!open}
                    >
                        <div className="rounded-2xl border-2 border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:p-5">
                            <div className="mb-3 min-w-0">
                                <p className="text-sm font-semibold">{title}</p>
                                {description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                                )}
                            </div>
                            {panelContent}
                        </div>
                    </div>
                )}

                <Button
                    type="button"
                    onClick={() => onOpenChange(!open)}
                    aria-expanded={open}
                    aria-label={open ? "Close actions menu" : triggerLabel}
                    className={cn(
                        "pointer-events-auto relative h-14 w-14 rounded-full shadow-2xl shadow-primary/25 gradient-brand text-white hover:opacity-95",
                        open && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                    )}
                >
                    {open ? <X className="h-5 w-5" /> : (triggerIcon ?? <Menu className="h-5 w-5" />)}
                    {badge != null && badge !== "" && !open && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                            {badge}
                        </span>
                    )}
                </Button>
            </div>

            {isMobile && (
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent className="pb-safe">
                        <DrawerHeader className="text-left">
                            <DrawerTitle>{title}</DrawerTitle>
                            {description && <DrawerDescription>{description}</DrawerDescription>}
                        </DrawerHeader>
                        <div className="px-4 pb-6">{panelContent}</div>
                    </DrawerContent>
                </Drawer>
            )}
        </>
    );
}
