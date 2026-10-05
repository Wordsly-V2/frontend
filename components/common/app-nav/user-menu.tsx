"use client";

import { openCommandPalette } from "@/components/common/app-nav/nav-icons";
import { ChangeThemeToggle } from "@/components/common/change-theme-toggle/change-theme-toggle";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { ChevronsUpDown, Command, LogOut, Settings, ShieldCheck, Smartphone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserMenuProps {
    /**
     * `avatar`: just the picture (mobile top bar, folded sidebar).
     * `row`: picture, name and email (the open sidebar's footer).
     */
    variant?: "avatar" | "row";
    /** Where the menu opens relative to the trigger. */
    side?: "top" | "bottom" | "right";
    /** Adds Manage and Commands, which the mobile tab bar has no room for. */
    withAppLinks?: boolean;
    className?: string;
}

/** The signed-in learner's menu: profile, admin, theme, sign out. */
export function UserMenu({
    variant = "avatar",
    side = "bottom",
    withAppLinks = false,
    className,
}: Readonly<UserMenuProps>) {
    const router = useRouter();
    const { profile, logout } = useUser();
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!profile) return null;

    const handleLogoutChoice = async (fromAllDevices: boolean) => {
        setIsLoggingOut(true);
        try {
            await logout({ allDevices: fromAllDevices, redirectTo: "/auth/login" });
            setLogoutDialogOpen(false);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const avatar = (
        <Avatar className="h-9 w-9 shrink-0">
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
                    {withAppLinks && (
                        <>
                            <DropdownMenuItem onClick={() => router.push("/manage")} className="cursor-pointer rounded-lg">
                                <Settings className="mr-2 h-4 w-4" />
                                Manage words
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={openCommandPalette} className="cursor-pointer rounded-lg">
                                <Command className="mr-2 h-4 w-4" />
                                Go to…
                            </DropdownMenuItem>
                        </>
                    )}
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

            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log out</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you want to log out on this device only or from all devices?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel disabled={isLoggingOut} className="w-full sm:w-auto">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="outline"
                            disabled={isLoggingOut}
                            onClick={() => handleLogoutChoice(false)}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <Smartphone className="h-4 w-4" />
                            This device only
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isLoggingOut}
                            onClick={() => handleLogoutChoice(true)}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <LogOut className="h-4 w-4" />
                            All devices
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
