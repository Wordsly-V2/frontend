"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Streak-reminder opt-in card for the profile page: a toggle to enable/disable
 * web-push reminders plus a time picker bound to the saved preference. The
 * permission request only fires from the toggle click (a real user gesture).
 */
export function NotificationReminderCard() {
    const {
        status,
        isSupported,
        isBusy,
        error,
        reminderTime,
        enable,
        disable,
        setReminderTime,
    } = usePushNotifications();

    const [timeValue, setTimeValue] = useState(reminderTime);

    useEffect(() => {
        setTimeValue(reminderTime);
    }, [reminderTime]);

    const isEnabled = status === "enabled";

    const handleToggle = (checked: boolean) => {
        if (checked) enable(timeValue);
        else disable();
    };

    const handleTimeChange = (value: string) => {
        setTimeValue(value);
        if (isEnabled && value) setReminderTime(value);
    };

    return (
        <Card className="border-border/80 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isEnabled ? (
                        <Bell className="h-5 w-5 text-primary" aria-hidden />
                    ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" aria-hidden />
                    )}
                    Streak reminders
                </CardTitle>
                <CardDescription>
                    Get a gentle nudge each day so you never break your streak.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {status === "unsupported" && (
                    <p className="text-sm text-muted-foreground">
                        Your browser doesn&rsquo;t support reminders yet.
                    </p>
                )}
                {status === "ios-needs-install" && (
                    <p className="text-sm text-muted-foreground">
                        Add Wordsly to your home screen first, then turn on reminders
                        from there.
                    </p>
                )}

                {isSupported && status !== "ios-needs-install" && (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <Label
                                htmlFor="streak-reminder-toggle"
                                className="text-sm font-medium"
                            >
                                Daily reminder
                            </Label>
                            <Switch
                                id="streak-reminder-toggle"
                                checked={isEnabled}
                                onCheckedChange={handleToggle}
                                disabled={isBusy || status === "denied"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reminder-time" className="text-sm font-medium">
                                Remind me at
                            </Label>
                            <Input
                                id="reminder-time"
                                type="time"
                                value={timeValue}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                disabled={isBusy}
                                className="w-40"
                            />
                        </div>

                        {status === "denied" && (
                            <p className="text-sm text-muted-foreground">
                                Notifications are blocked. Turn them back on in your browser
                                settings to get reminders.
                            </p>
                        )}
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
