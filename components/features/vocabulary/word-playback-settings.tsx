"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    wordDetailsAutoNextSchema,
    type WordDetailsAutoNextFormValues,
} from "@/lib/schemas/word-details-auto-next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export interface WordPlaybackSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: WordDetailsAutoNextFormValues;
    onSave: (next: WordDetailsAutoNextFormValues) => void;
}

export function WordPlaybackSettings({
    open,
    onOpenChange,
    value,
    onSave,
}: Readonly<WordPlaybackSettingsProps>) {
    const form = useForm<WordDetailsAutoNextFormValues>({
        resolver: zodResolver(wordDetailsAutoNextSchema),
        defaultValues: value,
        mode: "onChange",
    });

    useEffect(() => {
        if (open) {
            form.reset(value);
        }
    }, [open, value, form]);

    const onSubmit = form.handleSubmit((data) => {
        onSave(data);
        onOpenChange(false);
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] sm:max-w-md">
                <DialogHeader className="text-left">
                    <DialogTitle>Playback</DialogTitle>
                    <DialogDescription>
                        Auto-advance after each word&apos;s audio (or after a delay if there is no audio).
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={onSubmit}
                    className="flex flex-col gap-6"
                >
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="playback-auto-next" className="text-base">
                                Auto next
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Go to the next word automatically
                            </p>
                        </div>
                        <Switch
                            id="playback-auto-next"
                            checked={form.watch("enabled")}
                            onCheckedChange={(checked) =>
                                form.setValue("enabled", checked, { shouldValidate: true })
                            }
                            aria-label="Automatically go to the next word"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="playback-delay">Delay (seconds)</Label>
                        <Input
                            id="playback-delay"
                            type="number"
                            min={1}
                            max={600}
                            step={1}
                            className="tabular-nums"
                            aria-describedby="playback-delay-hint"
                            {...form.register("delaySec", { valueAsNumber: true })}
                        />
                        <p id="playback-delay-hint" className="text-xs text-muted-foreground">
                            Wait time after audio ends (or between words with no audio).
                        </p>
                        {form.formState.errors.delaySec && (
                            <p className="text-xs text-destructive" role="alert">
                                {form.formState.errors.delaySec.message}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="flex-row gap-2 px-0 pt-0 sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="cursor-pointer">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="cursor-pointer">
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
