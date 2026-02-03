"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNav() {
    const pathname = usePathname();
    
    const isManageMode = pathname?.startsWith('/manage');
    const isLearnMode = pathname?.startsWith('/learn');

    return (
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
                        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span>Wordsly</span>
                    </Link>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <Link href="/learn">
                            <Button
                                variant={isLearnMode ? "default" : "ghost"}
                                size="sm"
                                className="gap-2"
                            >
                                <BookOpen className="h-4 w-4" />
                                Learn
                            </Button>
                        </Link>
                        <Link href="/manage">
                            <Button
                                variant={isManageMode ? "default" : "ghost"}
                                size="sm"
                                className="gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Manage
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
