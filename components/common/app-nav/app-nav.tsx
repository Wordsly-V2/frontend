"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Settings, User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/useUser.hook";
import { ChangeThemeToggle } from "@/components/common/change-theme-toggle/change-theme-toggle";

export default function AppNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isLoading, logout } = useUser();
    
    const isManageMode = pathname?.startsWith('/manage');
    const isLearnMode = pathname?.startsWith('/learn');
    const isAuthPage = pathname?.startsWith('/auth');

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    const renderUserSection = () => {
        if (isLoading) {
            return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;
        }

        if (profile) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-background ring-primary/20 hover:ring-primary/40 transition-all hover:scale-110"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarImage
                                    src={profile.pictureUrl ?? ''}
                                    alt={profile.displayName ?? ''}
                                    loading="lazy"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="gradient-brand text-white font-semibold">
                                    {profile.displayName?.charAt(0) ?? 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none">
                                    {profile.displayName}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
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
                            onClick={handleLogout}
                            className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return (
            <Link href="/auth/login">
                <Button size="sm" className="gap-2 rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                </Button>
            </Link>
        );
    };

    return (
        <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span>Wordsly</span>
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
                                    <span className="hidden sm:inline">Learn</span>
                                </Button>
                            </Link>
                            <Link href="/manage">
                                <Button
                                    variant={isManageMode ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-2 rounded-lg transition-all hover:scale-105"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">Manage</span>
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Right - User Menu */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Mode Toggle */}
                        {!isAuthPage && profile && (
                            <div className="flex md:hidden items-center gap-2">
                                <Link href="/learn">
                                    <Button
                                        variant={isLearnMode ? "default" : "ghost"}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/manage">
                                    <Button
                                        variant={isManageMode ? "default" : "ghost"}
                                        size="sm"
                                        className="gap-2"
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
