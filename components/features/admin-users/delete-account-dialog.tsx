"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_ACCOUNT_REMOVES, confirmsDelete, deleteConfirmation } from "@/lib/admin/users";
import type { AdminUserDetail } from "@/types/admin-users/admin-users.type";
import { Trash2 } from "lucide-react";
import { useId, useState } from "react";

/** Confirm deleting an account: lists what goes, and the admin types the email. */
export function DeleteAccountDialog({
    user,
    name,
    onClose,
    onConfirm,
    isLoading,
}: Readonly<{
    user: AdminUserDetail;
    name: string;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}>) {
    const [typed, setTyped] = useState("");
    const inputId = useId();
    const expected = deleteConfirmation(user);
    const confirmed = confirmsDelete(typed, user);

    return (
        <AlertDialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
            <AlertDialogContent className="max-w-lg sm:mx-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">Delete {name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This deletes the account for good and can&apos;t be undone. If they sign in with Google again,
                        they start over as a new learner.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 text-sm">
                    <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Removed</p>
                        <ul className="space-y-1.5">
                            {DELETE_ACCOUNT_REMOVES.map((item) => (
                                <li key={item} className="flex gap-2">
                                    <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <form
                        className="space-y-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (confirmed && !isLoading) onConfirm();
                        }}
                    >
                        <Label htmlFor={inputId} className="block font-normal leading-relaxed">
                            Type <span className="break-all font-mono font-semibold">{expected}</span> to confirm
                        </Label>
                        <Input
                            id={inputId}
                            value={typed}
                            onChange={(event) => setTyped(event.target.value)}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            disabled={isLoading}
                        />
                    </form>
                </div>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel disabled={isLoading} className="w-full text-sm sm:w-auto">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                        disabled={!confirmed || isLoading}
                        className="w-full bg-destructive text-sm hover:bg-destructive/90 sm:w-auto"
                    >
                        {isLoading ? "Deleting…" : "Delete account"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
