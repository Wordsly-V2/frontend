"use client";

import { Button } from "@/components/ui/button";
import { playAudioUrl } from "@/lib/practice-audio";
import { canSpeak, speak } from "@/lib/path/speech";
import { cn } from "@/lib/utils";
import type { PathExample } from "@/types/path/path.type";
import { Volume2 } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** Plays `audioUrl` when there is one, otherwise speaks `text` with TTS. */
export function playPathAudio(text: string, audioUrl?: string): void {
    if (audioUrl) {
        playAudioUrl(audioUrl);
        return;
    }
    speak(text);
}

/** Round "listen" button. Hidden when the browser has neither TTS nor a URL. */
export function SpeakButton({
    text,
    audioUrl,
    label = "Listen",
    size = "icon",
    className,
}: Readonly<{
    text: string;
    audioUrl?: string;
    label?: string;
    size?: "icon" | "icon-sm" | "icon-lg";
    className?: string;
}>) {
    // speechSynthesis only exists in the browser: read it after hydration.
    const supported = useSyncExternalStore(subscribeNoop, canSpeak, () => false);
    if (!supported && !audioUrl) return null;

    return (
        <Button
            type="button"
            variant="outline"
            size={size}
            aria-label={`${label}: ${text}`}
            onClick={() => playPathAudio(text, audioUrl)}
            className={cn("shrink-0 rounded-full", className)}
        >
            <Volume2 aria-hidden />
        </Button>
    );
}

/** `en` with its `highlight` emphasised (first match, case-insensitive). */
export function HighlightedText({ text, highlight }: Readonly<{ text: string; highlight?: string }>) {
    const at = highlight ? text.toLowerCase().indexOf(highlight.toLowerCase()) : -1;
    if (!highlight || at < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, at)}
            <mark className="rounded bg-primary/15 px-0.5 font-bold text-primary">
                {text.slice(at, at + highlight.length)}
            </mark>
            {text.slice(at + highlight.length)}
        </>
    );
}

/** An English example with its Vietnamese meaning and a listen button. */
export function ExampleLine({ example }: Readonly<{ example: PathExample }>) {
    return (
        <div className="flex items-start gap-3">
            <SpeakButton text={example.en} size="icon-sm" />
            <div className="min-w-0">
                <p className="font-medium">
                    <HighlightedText text={example.en} highlight={example.highlight} />
                </p>
                <p className="text-sm text-muted-foreground">{example.vi}</p>
            </div>
        </div>
    );
}
