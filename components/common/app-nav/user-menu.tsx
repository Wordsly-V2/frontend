"use client";

import { LogoutDialog } from "@/components/common/app-nav/logout-dialog";
import { ChangeThemeToggle } from "@/components/common/change-theme-toggle/change-theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser.hook";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { IUserProfile } from "@/types/users/users.type";
import { ChevronsUpDown, LogOut, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserMenuProps {
    /**
     * `avatar`: just the picture (the folded sidebar).
     * `row`: picture, name and email (the open sidebar's footer).
     */
    variant?: "avatar" | "row";
    /** Where the menu opens relative to the trigger. */
    side?: "top" | "bottom" | "right";
    className?: string;
}

/** The signed-in learner's menu: profile, admin, theme, sign out. */
export function UserMenu({
    variant = "avatar",
    side = "bottom",
    className,
}: Readonly<UserMenuProps>) {
    const router = useRouter();
    const { profile } = useUser();
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    if (!profile) return null;

    const avatar = <UserAvatar profile={profile} />;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {variant === "row" ? (
                        <button
                            type="button"
                            className={cn(
                                "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                className,
                            )}
                        >
                            {avatar}
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold leading-tight">
                                    {profile.displayName}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                    {profile.gmail}
                                </span>
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        </button>
                    ) : (
                        <button
                            type="button"
                            aria-label="Account menu"
                            className={cn(
                                "rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-shadow hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-ring",
                                className,
                            )}
                        >
                            {avatar}
                        </button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side={side}
                    align={side === "bottom" ? "end" : "start"}
                    sideOffset={8}
                    className="w-60 rounded-2xl p-1.5"
                >
                    <DropdownMenuLabel className="font-normal">
                        <p className="truncate text-sm font-bold leading-tight">{profile.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{profile.gmail}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer rounded-lg">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>
                    {isAdmin(profile) && (
                        <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer rounded-lg">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg"
                        onSelect={(e) => e.preventDefault()}
                    >
                        <ChangeThemeToggle />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setLogoutDialogOpen(true)}
                        className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
        </>
    );
}

/** The learner's picture, or their initial on the brand gradient. */
export function UserAvatar({
    profile,
    className,
}: Readonly<{ profile: Pick<IUserProfile, "pictureUrl" | "displayName">; className?: string }>) {
    return (
        <Avatar className={cn("h-9 w-9 shrink-0", className)}>
            <AvatarImage
                src={profile.pictureUrl ?? ""}
                alt=""
                loading="lazy"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />
            <AvatarFallback className="gradient-brand text-sm font-bold text-white">
                {profile.displayName?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
        </Avatar>
    );
}
