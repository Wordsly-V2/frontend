'use client';

import WordProgressBadge from '@/components/common/word-progress-stats/word-progress-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IWord } from '@/types/courses/courses.type';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    startTransition,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import WordDetailCard from './word-detail-card';

const WORD_DETAILS_AUTO_NEXT_STORAGE_KEY = 'wordsly.wordDetails.autoNext';

const DELAY_BETWEEN_WORDS_MIN_SEC = 1;
const DELAY_BETWEEN_WORDS_MAX_SEC = 600;
const DELAY_BETWEEN_WORDS_DEFAULT_SEC = 5;

function clampDelayBetweenWordsSec(value: number): number {
    if (!Number.isFinite(value)) return DELAY_BETWEEN_WORDS_DEFAULT_SEC;
    return Math.min(
        DELAY_BETWEEN_WORDS_MAX_SEC,
        Math.max(DELAY_BETWEEN_WORDS_MIN_SEC, Math.round(value)),
    );
}

type WordDetailsAutoNextStored = {
    enabled: boolean;
    delaySec: number;
};

function readAutoNextSettingsFromStorage(): WordDetailsAutoNextStored | null {
    if (globalThis.window === undefined) return null;
    try {
        const raw = globalThis.localStorage.getItem(
            WORD_DETAILS_AUTO_NEXT_STORAGE_KEY,
        );
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (parsed === true || parsed === false) {
            return { enabled: parsed, delaySec: DELAY_BETWEEN_WORDS_DEFAULT_SEC };
        }
        if (parsed && typeof parsed === 'object' && 'enabled' in parsed) {
            const enabled = (parsed as { enabled?: unknown }).enabled;
            const rawDelay = (parsed as { delaySec?: unknown }).delaySec;
            if (typeof enabled === 'boolean') {
                const delaySec =
                    typeof rawDelay === 'number'
                        ? clampDelayBetweenWordsSec(rawDelay)
                        : DELAY_BETWEEN_WORDS_DEFAULT_SEC;
                return { enabled, delaySec };
            }
        }
        return null;
    } catch {
        return null;
    }
}

function writeAutoNextSettingsToStorage(settings: WordDetailsAutoNextStored) {
    try {
        globalThis.localStorage.setItem(
            WORD_DETAILS_AUTO_NEXT_STORAGE_KEY,
            JSON.stringify({
                enabled: settings.enabled,
                delaySec: clampDelayBetweenWordsSec(settings.delaySec),
            }),
        );
    } catch {
        // Quota, private mode, or disabled storage — ignore
    }
}

export interface WordDetailsCarouselProps {
    words: IWord[];
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    cardLayout?: 'horizontal' | 'stack';
    navVariant?: 'icons' | 'minimal';
    headerSlot?: React.ReactNode;
    className?: string;
}

export default function WordDetailsCarousel({
    words,
    initialIndex = 0,
    onIndexChange,
    cardLayout = 'horizontal',
    navVariant = 'icons',
    headerSlot,
    className = '',
}: Readonly<WordDetailsCarouselProps>) {
    const [index, setIndex] = useState(initialIndex);
    const [autoAdvanceNext, setAutoAdvanceNext] = useState(false);
    const [delayBetweenWordsSec, setDelayBetweenWordsSec] = useState(
        DELAY_BETWEEN_WORDS_DEFAULT_SEC,
    );
    const [autoNextStorageReady, setAutoNextStorageReady] = useState(false);
    const autoAdvanceRef = useRef(false);
    const count = words.length;
    const effectiveIndex = count > 0 ? Math.min(index, count - 1) : 0;
    const word = count > 0 ? words[effectiveIndex] : null;

    const goNext = useCallback(() => {
        setIndex((i) => (count > 0 ? (i + 1) % count : 0));
    }, [count]);

    const goPrev = useCallback(() => {
        setIndex((i) => (count > 0 ? (i - 1 + count) % count : 0));
    }, [count]);

    useEffect(() => {
        startTransition(() => {
            const stored = readAutoNextSettingsFromStorage();
            if (stored !== null) {
                setAutoAdvanceNext(stored.enabled);
                setDelayBetweenWordsSec(stored.delaySec);
            }
            setAutoNextStorageReady(true);
        });
    }, []);

    useEffect(() => {
        if (!autoNextStorageReady) return;
        writeAutoNextSettingsToStorage({
            enabled: autoAdvanceNext,
            delaySec: delayBetweenWordsSec,
        });
    }, [autoNextStorageReady, autoAdvanceNext, delayBetweenWordsSec]);

    useEffect(() => {
        autoAdvanceRef.current = autoAdvanceNext;
    }, [autoAdvanceNext]);

    useEffect(() => {
        onIndexChange?.(effectiveIndex);
    }, [effectiveIndex, onIndexChange]);

    // Auto-play word audio when slide changes; optional auto-advance after audio ends (or after delay if no audio)
    useEffect(() => {
        if (count === 0) return;

        let cancelled = false;
        let audioEl: HTMLAudioElement | null = null;

        let initialTimer: ReturnType<typeof setTimeout> | undefined;
        let noAudioTimer: ReturnType<typeof setTimeout> | undefined;
        const delayMs = clampDelayBetweenWordsSec(delayBetweenWordsSec) * 1000;
        const onAudioEnded = () => {
            initialTimer = setTimeout(() => {
                if (!cancelled && autoAdvanceRef.current) goNext();
            }, delayMs);
        };

        if (word?.audioUrl) {
            if (cancelled) return;
            audioEl = new Audio(word.audioUrl);
            audioEl.addEventListener('ended', onAudioEnded);
            audioEl.play().catch(console.error);
        } else if (autoAdvanceNext) {
            onAudioEnded();
        }

        return () => {
            cancelled = true;
            if (initialTimer !== undefined) clearTimeout(initialTimer);
            if (noAudioTimer !== undefined) clearTimeout(noAudioTimer);
            if (audioEl) {
                audioEl.removeEventListener('ended', onAudioEnded);
                audioEl.pause();
            }
        };
    }, [
        effectiveIndex,
        word?.audioUrl,
        count,
        goNext,
        autoAdvanceNext,
        delayBetweenWordsSec,
    ]);

    useEffect(() => {
        if (count === 0) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };
        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [count, goPrev, goNext]);

    if (count === 0) {
        return (
            <div
                className={`flex flex-col items-center justify-center py-12 text-muted-foreground ${className}`}
            >
                <p className='text-sm'>No words to show.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-0 flex-1 gap-4 ${className}`}>
            {/* Nav + optional header — shrink-0 so card gets remaining space */}
            <div className='flex items-center justify-between gap-4 flex-wrap shrink-0'>
                <Button
                    type='button'
                    variant='outline'
                    size={navVariant === 'minimal' ? 'icon' : 'default'}
                    onClick={goPrev}
                    aria-label='Previous word'
                    className='shrink-0'
                >
                    <ChevronLeft className='h-5 w-5 sm:mr-1' />
                    {navVariant !== 'minimal' && (
                        <span className='hidden sm:inline'>Previous</span>
                    )}
                </Button>
                {headerSlot}
                <Button
                    type='button'
                    variant='outline'
                    size={navVariant === 'minimal' ? 'icon' : 'default'}
                    onClick={goNext}
                    aria-label='Next word'
                    className='shrink-0'
                >
                    {navVariant !== 'minimal' && (
                        <span className='hidden sm:inline'>Next</span>
                    )}
                    <ChevronRight className='h-5 w-5 sm:ml-1' />
                </Button>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 shrink-0'>
                <div className='flex items-center gap-2'>
                    <Switch
                        id='word-details-auto-next'
                        checked={autoAdvanceNext}
                        onCheckedChange={setAutoAdvanceNext}
                        aria-label='Automatically go to the next word'
                    />
                    <Label
                        htmlFor='word-details-auto-next'
                        className='text-sm font-normal text-muted-foreground cursor-pointer'
                    >
                        Auto next
                    </Label>
                </div>
                <div className='flex items-center gap-2'>
                    <Label
                        htmlFor='word-details-delay-sec'
                        className='text-sm font-normal text-muted-foreground whitespace-nowrap'
                    >
                        Delay (sec)
                    </Label>
                    <Input
                        id='word-details-delay-sec'
                        type='number'
                        min={DELAY_BETWEEN_WORDS_MIN_SEC}
                        max={DELAY_BETWEEN_WORDS_MAX_SEC}
                        step={1}
                        value={delayBetweenWordsSec}
                        onChange={(e) => {
                            const n = Number.parseInt(e.target.value, 10);
                            if (Number.isNaN(n)) return;
                            setDelayBetweenWordsSec(clampDelayBetweenWordsSec(n));
                        }}
                        className='h-9 w-[4.5rem] tabular-nums'
                        aria-label='Seconds to wait before the next word when there is no audio'
                    />
                </div>
            </div>

            {/* Word progress stats (when available) */}
            {word?.wordProgress && (
                <div className='shrink-0 flex justify-center'>
                    <WordProgressBadge progress={word.wordProgress} />
                </div>
            )}

            {/* Card: flex-1 min-h-0 so content fits in view; only examples scroll inside card */}
            <div
                className='flex-1 min-h-0 overflow-hidden flex flex-col'
                key={effectiveIndex}
            >
                <WordDetailCard
                    word={word!}
                    layout={cardLayout}
                    constrainHeight
                    className='h-full animate-in fade-in duration-200'
                />
            </div>
        </div>
    );
}
