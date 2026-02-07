"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Settings, User, LogOut, LogIn, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
                                className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-offset-2 ring-offset-background ring-primary/20 hover:ring-primary/40 transition-all hover:scale-110 p-0"
                            >
                                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
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
                <Button size="sm" className="gap-1.5 sm:gap-2 rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 h-8 sm:h-9 px-2 sm:px-3">
                    <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Login</span>
                </Button>
            </Link>
        );
    };

    return (
        <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-3 sm:px-4">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
                            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="hidden xs:inline">Wordsly</span>
                    </Link>

                    {/* Center - Mode Toggle */}
                    {!isAuthPage && profile && (
                        <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                            <Link href="/learn">
                                <Button
                                    variant={isLearnMode ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-2 rounded-lg transition-all hover:scale-105"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    <span>Learn</span>
                                </Button>
                            </Link>
                            <Link href="/manage">
                                <Button
                                    variant={isManageMode ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-2 rounded-lg transition-all hover:scale-105"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Manage</span>
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Right - User Menu */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Mobile Mode Toggle */}
                        {!isAuthPage && profile && (
                            <div className="flex md:hidden items-center gap-1">
                                <Link href="/learn">
                                    <Button
                                        variant={isLearnMode ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/manage">
                                    <Button
                                        variant={isManageMode ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* User Profile or Login */}
                        {renderUserSection()}
                    </div>
                </div>
            </div>
        </nav>
    );
}
