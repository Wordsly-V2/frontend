"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser.hook";
import { LogOut, Smartphone } from "lucide-react";
import { useState } from "react";

/** Asks whether to sign out on this device only or everywhere, then does it. */
export function LogoutDialog({
    open,
    onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
    const { logout } = useUser();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutChoice = async (fromAllDevices: boolean) => {
        setIsLoggingOut(true);
        try {
            await logout({ allDevices: fromAllDevices, redirectTo: "/auth/login" });
            onOpenChange(false);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Log out</AlertDialogTitle>
                    <AlertDialogDescription>
                        Do you want to log out on this device only or from all devices?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel disabled={isLoggingOut} className="w-full sm:w-auto">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="outline"
                        disabled={isLoggingOut}
                        onClick={() => handleLogoutChoice(false)}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <Smartphone className="h-4 w-4" />
                        This device only
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isLoggingOut}
                        onClick={() => handleLogoutChoice(true)}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <LogOut className="h-4 w-4" />
                        All devices
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
