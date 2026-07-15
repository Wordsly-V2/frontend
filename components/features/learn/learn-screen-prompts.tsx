"use client";

import { InstallPrompt } from "@/components/common/pwa/install-prompt";
import { StreakReminderPrompt } from "@/components/features/learn/streak-reminder-prompt";
import { usePathname } from "next/navigation";

/**
 * Unobtrusive prompts for the Learn area, rendered from the learn layout so we
 * don't touch the page files. The streak reminder only shows on the Learn home
 * screen; the install prompt can appear across Learn screens.
 */
export function LearnScreenPrompts() {
    const pathname = usePathname();
    const isLearnHome = pathname === "/learn";

    return (
        <>
            {isLearnHome && (
                <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-6 sm:left-6 sm:right-auto sm:justify-start">
                    <div className="pointer-events-auto w-full max-w-sm">
                        <StreakReminderPrompt />
                    </div>
                </div>
            )}
            <InstallPrompt />
        </>
    );
}
