"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";
import { playAudioUrl } from "@/lib/practice-audio";
import { AlertTriangle, Volume2 } from "lucide-react";

interface LeechWordBannerProps {
    example?: string;
    audioUrl?: string;
}

export function LeechWordBanner({
    example,
    audioUrl,
}: Readonly<LeechWordBannerProps>) {
    return (
        <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-3 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0 text-left space-y-2">
                    <p className="font-medium">Tricky word — extra help</p>
                    {example && (
                        <AdaptiveText
                            text={`"${example}"`}
                            role="example"
                            className="text-xs italic text-amber-700/90 dark:text-amber-300/90"
                        />
                    )}
                    {audioUrl && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-amber-300/60 bg-white/50 dark:bg-transparent"
                            onClick={() => playAudioUrl(audioUrl)}
                        >
                            <Volume2 className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                            Listen again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
