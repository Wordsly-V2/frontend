"use client";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { cn } from "@/lib/utils";
import { Download, Share, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Dismissible "Install Wordsly" card. Uses the native prompt on Chromium and
 * shows Add-to-Home-Screen steps on iOS. Persists dismissal via the storage
 * helper so it doesn't reappear. Renders nothing when there's nothing to offer.
 */
export function InstallPrompt({ className }: { className?: string }) {
    const { canPrompt, isIos, promptInstall, dismiss } = useInstallPrompt();
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence>
            {canPrompt && (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
                    className={cn(
                        "glass-surface fixed inset-x-4 bottom-20 z-40 mx-auto max-w-sm rounded-2xl p-4 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0",
                        className,
                    )}
                    role="dialog"
                    aria-label="Install Wordsly"
                >
                    <button
                        type="button"
                        onClick={dismiss}
                        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Download className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pr-4">
                            <p className="font-semibold text-foreground">Install Wordsly</p>
                            {isIos ? (
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                    Tap{" "}
                                    <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" />{" "}
                                    then <span className="font-medium">Add to Home Screen</span> to
                                    practice like an app.
                                </p>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                    Add it to your home screen for faster practice, even offline.
                                </p>
                            )}
                            {!isIos && (
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" onClick={promptInstall}>
                                        Install
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={dismiss}>
                                        Not now
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
