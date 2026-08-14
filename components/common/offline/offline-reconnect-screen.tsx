"use client";

import { Button } from "@/components/ui/button";
import { recheckOnlineStatus } from "@/lib/offline/online-status";
import { useAppDispatch } from "@/store/hooks";
import { fetchProfile } from "@/store/slices/userSlice";
import { WifiOff } from "lucide-react";
import { useState } from "react";

/**
 * Shown when we are offline and the sign-in can no longer be trusted from cache.
 *
 * Deliberately not a spinner and not a redirect to /auth/login — offline that
 * page cannot load either, so the learner would just see the app appear broken.
 */
export default function OfflineReconnectScreen() {
    const dispatch = useAppDispatch();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await recheckOnlineStatus();
            await dispatch(fetchProfile({ force: true }));
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center px-4">
            <div className="glass-surface flex max-w-sm flex-col items-center gap-4 rounded-2xl p-8 text-center">
                <WifiOff className="h-10 w-10 text-muted-foreground" />
                <h1 className="text-xl font-bold">Reconnect to keep learning</h1>
                <p className="text-sm text-muted-foreground">
                    We need to check your account again. Anything you practiced
                    offline is saved on this device and will sync once
                    you&apos;re back online.
                </p>
                <Button onClick={handleRetry} disabled={isRetrying}>
                    {isRetrying ? "Checking..." : "Try again"}
                </Button>
            </div>
        </main>
    );
}
