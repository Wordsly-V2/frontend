'use client';

import WordProgressBadge from '@/components/common/word-progress-stats/word-progress-badge';
import { WordPlaybackSettings } from '@/components/features/vocabulary/word-playback-settings';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WordDetailsAutoNextFormValues } from '@/lib/schemas/word-details-auto-next';
import { handleAudioPlayError } from "@/lib/audio-playback";
import { IWord } from '@/types/courses/courses.type';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { clampDelayBetweenWordsSec } from '@/lib/word-details-auto-next';
import { useWordDetailsAutoNext } from '@/hooks/useWordDetailsAutoNext.hook';
import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import WordDetailCard from './word-detail-card';

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
    const { autoNext: autoNextSettings, setAutoNext } = useWordDetailsAutoNext();
    const autoAdvanceNext = autoNextSettings.enabled;
    const delayBetweenWordsSec = autoNextSettings.delaySec;
    const autoAdvanceRef = useRef(false);
    const swiperRef = useRef<SwiperType | null>(null);
    const reduceMotion = useReducedMotion();
    const [playbackOpen, setPlaybackOpen] = useState(false);
    const count = words.length;
    const effectiveIndex = count > 0 ? Math.min(index, count - 1) : 0;
    const word = count > 0 ? words[effectiveIndex] : null;

    const goNext = useCallback(() => {
        swiperRef.current?.slideNext();
    }, []);

    const goPrev = useCallback(() => {
        swiperRef.current?.slidePrev();
    }, []);

    const handlePlaybackSave = useCallback((next: WordDetailsAutoNextFormValues) => {
        setAutoNext({
            enabled: next.enabled,
            delaySec: clampDelayBetweenWordsSec(next.delaySec),
        });
    }, [setAutoNext]);

    const handleSlideChange = useCallback((swiper: SwiperType) => {
        setIndex(swiper.activeIndex);
    }, []);

    useEffect(() => {
        autoAdvanceRef.current = autoAdvanceNext;
    }, [autoAdvanceNext]);

    useEffect(() => {
        onIndexChange?.(effectiveIndex);
    }, [effectiveIndex, onIndexChange]);

    // Keep Swiper in sync when the list shrinks or index is clamped (e.g. data refresh)
    useEffect(() => {
        const s = swiperRef.current;
        if (!s || s.destroyed) return;
        if (s.activeIndex !== effectiveIndex) {
            s.slideTo(effectiveIndex, 0, false);
        }
    }, [effectiveIndex, count]);

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
            audioEl.play().catch(handleAudioPlayError);
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type='button'
                            variant='outline'
                            size={navVariant === 'minimal' ? 'icon' : 'default'}
                            onClick={goPrev}
                            aria-label='Previous word'
                            className='shrink-0 cursor-pointer'
                        >
                            <ChevronLeft className='h-5 w-5 sm:mr-1' />
                            {navVariant !== 'minimal' && (
                                <span className='hidden sm:inline'>Previous</span>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Previous word (←)</TooltipContent>
                </Tooltip>
                {headerSlot ? (
                    <motion.div
                        key={effectiveIndex}
                        initial={reduceMotion ? false : { opacity: 0.65, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                        }
                        className='min-w-0 flex-1 flex justify-center'
                    >
                        {headerSlot}
                    </motion.div>
                ) : (
                    <div className='min-w-0 flex-1' aria-hidden />
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type='button'
                            variant='outline'
                            size={navVariant === 'minimal' ? 'icon' : 'default'}
                            onClick={goNext}
                            aria-label='Next word'
                            className='shrink-0 cursor-pointer'
                        >
                            {navVariant !== 'minimal' && (
                                <span className='hidden sm:inline'>Next</span>
                            )}
                            <ChevronRight className='h-5 w-5 sm:ml-1' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Next word (→)</TooltipContent>
                </Tooltip>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-3 shrink-0'>
                <p className='text-sm text-muted-foreground tabular-nums'>
                    {autoAdvanceNext
                        ? `Auto on · ${delayBetweenWordsSec}s pause`
                        : 'Auto next off'}
                </p>
                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='cursor-pointer gap-1.5'
                    onClick={() => setPlaybackOpen(true)}
                    aria-label='Open playback settings'
                >
                    <SlidersHorizontal className='h-4 w-4' />
                    Playback
                </Button>
            </div>

            <WordPlaybackSettings
                open={playbackOpen}
                onOpenChange={setPlaybackOpen}
                value={{
                    enabled: autoAdvanceNext,
                    delaySec: delayBetweenWordsSec,
                }}
                onSave={handlePlaybackSave}
            />

            {/* Word progress stats (when available) */}
            {word?.wordProgress && (
                <div className='shrink-0 flex justify-center'>
                    <WordProgressBadge progress={word.wordProgress} />
                </div>
            )}

            {/* Swiper: touch/drag + keyboard; rewind matches circular prev/next */}
            <div className='flex-1 min-h-0 overflow-hidden flex flex-col min-w-0'>
                <Swiper
                    key={words.map((w) => w.id).join('|')}
                    modules={[Keyboard]}
                    keyboard={{ enabled: true }}
                    rewind={count > 1}
                    slidesPerView={1}
                    spaceBetween={0}
                    speed={300}
                    className='h-full w-full min-h-0 min-w-0 [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full [&_.swiper-slide]:flex [&_.swiper-slide]:flex-col [&_.swiper-slide]:min-h-0'
                    initialSlide={effectiveIndex}
                    onSwiper={(instance) => {
                        swiperRef.current = instance;
                    }}
                    onSlideChange={handleSlideChange}
                >
                    {words.map((w) => (
                        <SwiperSlide key={w.id} className='box-border'>
                            <WordDetailCard
                                word={w}
                                layout={cardLayout}
                                constrainHeight
                                className='h-full animate-in fade-in duration-200'
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
