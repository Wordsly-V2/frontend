"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/common/page";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InstallAppCard } from "@/components/features/profile/install-app-card";
import { NotificationReminderCard } from "@/components/features/profile/notification-reminder-card";
import { RecentSessions } from "@/components/features/profile/recent-sessions";
import { useUser } from "@/hooks/useUser.hook";
import { Info } from "lucide-react";

export default function ProfilePage() {
    const { profile: userProfile, isLoading, error, fetchProfile } = useUser();

    if (isLoading) {
        return (
            <main className="flex min-h-dvh items-center justify-center px-4">
                <LoadingSpinner size="lg" label="Loading profile…" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
                <p className="text-muted-foreground">Error: {error}</p>
                <Button onClick={() => fetchProfile()}>Try again</Button>
            </main>
        );
    }

    return (
        <PageShell>
            <PageHeader eyebrow="Account" title="Profile" description="Your account, reminders and recent practice." />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6">
                <aside className="lg:sticky lg:top-6 lg:self-start">
                    <section aria-label="Your account" className="surface-card overflow-hidden">
                        <div className="gradient-hero h-20" aria-hidden />
                        <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
                            <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                                <AvatarImage
                                    src={userProfile?.pictureUrl ?? ""}
                                    alt=""
                                    loading="lazy"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="gradient-brand text-2xl font-bold text-white">
                                    {userProfile?.displayName?.charAt(0).toUpperCase() ?? ""}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="mt-3 font-display text-xl font-bold">{userProfile?.displayName ?? ""}</h2>
                            <p className="mt-0.5 break-all text-sm text-muted-foreground">{userProfile?.gmail ?? ""}</p>

                            <div className="mt-5 flex w-full gap-2.5 rounded-2xl bg-primary/8 p-3 text-left dark:bg-primary/12">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Your name and email come from Google. To change them, update your Google profile,
                                    then sign in again.
                                </p>
                            </div>
                        </div>
                    </section>
                </aside>

                <div className="min-w-0 space-y-5 lg:space-y-6">
                    <NotificationReminderCard />
                    <RecentSessions />
                    <InstallAppCard />
                </div>
            </div>
        </PageShell>
    );
}
