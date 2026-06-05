"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import Image from "next/image";

interface WordPracticeHintsProps {
    maskedExamples: string[];
    imageUrl?: string;
    showImageHints: boolean;
}

export function WordPracticeHints({
    maskedExamples,
    imageUrl,
    showImageHints,
}: Readonly<WordPracticeHintsProps>) {
    const showImage = showImageHints && Boolean(imageUrl?.trim());
    const showExamples = maskedExamples.length > 0;
    if (!showImage && !showExamples) return null;

    return (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50 mx-auto w-full">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start text-left">
                {showExamples && (
                    <div className="flex-1 min-w-0 w-full">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Example sentences
                        </p>
                        <ul className="space-y-1.5 text-sm sm:text-base text-muted-foreground max-h-24 sm:max-h-32 overflow-y-auto overscroll-contain pr-1">
                            {maskedExamples.map((s) => (
                                <li key={s} className={LONG_TEXT_WRAP}>
                                    <AdaptiveText
                                        text={`"${s}"`}
                                        role="example"
                                        className="italic text-muted-foreground !text-sm sm:!text-base"
                                        scrollWhenLong={false}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {showImage && imageUrl && (
                    <div className="shrink-0 w-full sm:w-40">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Image hint
                        </p>
                        <div className="rounded-xl overflow-hidden bg-muted border border-border aspect-square max-h-40 sm:max-h-44 mx-auto sm:mx-0 w-full sm:w-40">
                            <Image
                                src={imageUrl}
                                alt=""
                                width={160}
                                height={160}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
