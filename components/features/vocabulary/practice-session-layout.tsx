"use client";

import { SavingOverlay } from "@/components/common/saving-overlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PracticeSessionLayoutProps {
    title: string;
    subtitle: string;
    onBack: () => void;
    backDisabled?: boolean;
    isPersisting?: boolean;
    children: ReactNode;
}

export function PracticeSessionLayout({
    title,
    subtitle,
    onBack,
    backDisabled = false,
    isPersisting = false,
    children,
}: Readonly<PracticeSessionLayoutProps>) {
    return (
        <main className="bg-background flex flex-col min-h-dvh">
            <SavingOverlay open={isPersisting} />
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 max-w-4xl flex flex-col flex-1">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="mb-3 sm:mb-4 self-start flex-shrink-0 text-muted-foreground hover:text-foreground"
                    size="sm"
                    disabled={backDisabled}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>
                <header className="text-center mb-4 sm:mb-6 flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
                </header>
                <div className="flex-1 pb-4 flex flex-col min-h-0">{children}</div>
            </div>
        </main>
    );
}
