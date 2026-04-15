"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Settings, User, LogOut, LogIn, Smartphone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyWordsSearch } from "@/components/common/my-words-search";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUser } from "@/hooks/useUser.hook";
import { ChangeThemeToggle } from "@/components/common/change-theme-toggle/change-theme-toggle";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function openCommandPalette() {
    globalThis.document.dispatchEvent(new Event("wordsly:open-command-palette"));
}

export default function AppNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isLoading, logout } = useUser();
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isManageMode = pathname?.startsWith('/manage');
    const isLearnMode = pathname?.startsWith('/learn');
    const isAuthPage = pathname?.startsWith('/auth');

    const handleLogoutChoice = async (fromAllDevices: boolean) => {
        setIsLoggingOut(true);
        try {
            await logout(fromAllDevices);
            setLogoutDialogOpen(false);
            router.push('/auth/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const renderUserSection = () => {
        if (isLoading) {
            return <LoadingSpinner size="sm" />;
        }

        if (profile) {
            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-offset-2 ring-offset-background ring-primary/15 hover:ring-primary/35 transition-all p-0"
                            >
                                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                                    <AvatarImage
                                        src={profile.pictureUrl ?? ''}
                                        alt={profile.displayName ?? ''}
                                        loading="lazy"
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                    />
                                    <AvatarFallback className="gradient-brand text-white font-semibold text-xs sm:text-sm">
                                        {profile.displayName?.charAt(0) ?? 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold leading-none truncate">
                                        {profile.displayName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">
                                        {profile.gmail}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => router.push('/profile')}
                                className="cursor-pointer rounded-lg"
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg"
                            >
                                <ChangeThemeToggle />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setLogoutDialogOpen(true)}
                                className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
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
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel disabled={isLoggingOut} className="w-full sm:w-auto">
                                    Cancel
                                </AlertDialogCancel>
                                <Button
                                    variant="outline"
                                    disabled={isLoggingOut}
                                    onClick={() => handleLogoutChoice(false)}
                                    className="w-full sm:w-auto gap-2"
                                >
                                    <Smartphone className="h-4 w-4" />
                                    This device only
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={isLoggingOut}
                                    onClick={() => handleLogoutChoice(true)}
                                    className="w-full sm:w-auto gap-2"
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

        return (
            <Link href="/auth/login">
                <Button size="sm" className="gap-1.5 sm:gap-2 rounded-xl gradient-brand text-white hover:opacity-95 transition-opacity shadow-md h-9 sm:h-10 px-3 sm:px-4">
                    <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Login</span>
                </Button>
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 pt-safe">
            <nav className="border-b border-border/60 bg-background/90 backdrop-blur-xl md:border-b-0 md:bg-transparent md:backdrop-blur-none">
                <div className="container mx-auto px-3 sm:px-4 md:px-5 md:pt-3 md:pb-2">
                    <div className="flex min-h-[3.25rem] sm:min-h-[3.5rem] items-center justify-between gap-2 md:rounded-2xl md:border md:border-border/60 md:bg-card/85 md:px-3 md:py-2 md:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:md:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex min-w-0 shrink items-center gap-2 font-semibold text-base sm:text-lg tracking-tight hover:opacity-85 transition-opacity"
                        >
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/20">
                                <GraduationCap className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5 text-primary-foreground" />
                            </div>
                            <span className="hidden min-[380px]:inline truncate">Wordsly</span>
                        </Link>

                        {/* Center - Search + Mode Toggle (desktop) */}
                        {!isAuthPage && profile && (
                            <div className="hidden min-[900px]:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
                                <MyWordsSearch />
                                <div className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-0.5 dark:bg-muted/25">
                                    <Link href="/learn">
                                        <Button
                                            variant={isLearnMode ? "default" : "ghost"}
                                            size="sm"
                                            className={`gap-1.5 rounded-lg px-3 ${isLearnMode ? "shadow-sm" : ""}`}
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            <span>Learn</span>
                                        </Button>
                                    </Link>
                                    <Link href="/manage">
                                        <Button
                                            variant={isManageMode ? "default" : "ghost"}
                                            size="sm"
                                            className={`gap-1.5 rounded-lg px-3 ${isManageMode ? "shadow-sm" : ""}`}
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>Manage</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Right + mobile center */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 gap-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={openCommandPalette}
                                aria-label="Open command palette"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <kbd className="pointer-events-none hidden sm:inline-flex h-6 select-none items-center rounded-md border border-border/80 bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                    ⌘K
                                </kbd>
                            </Button>
                            {!isAuthPage && profile && (
                                <div className="flex min-[900px]:hidden items-center gap-1">
                                    <MyWordsSearch className="max-w-[min(42vw,11rem)] sm:max-w-[200px]" />
                                    <Link href="/learn" className="shrink-0">
                                        <Button
                                            variant={isLearnMode ? "default" : "ghost"}
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-xl"
                                            aria-current={isLearnMode ? "page" : undefined}
                                        >
                                            <BookOpen className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/manage" className="shrink-0">
                                        <Button
                                            variant={isManageMode ? "default" : "ghost"}
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-xl"
                                            aria-current={isManageMode ? "page" : undefined}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {renderUserSection()}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
