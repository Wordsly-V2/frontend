'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

export type MascotMood = 'idle' | 'happy' | 'sad' | 'celebrate';

const SIZES = { sm: 48, md: 72, lg: 112 } as const;

/**
 * Wordsly mascot — a friendly rounded blob.
 * Pure SVG (no asset deps), recolors with brand tokens, reacts to mood.
 */
export function Mascot({
    mood = 'idle',
    size = 'md',
    className,
}: {
    mood?: MascotMood;
    size?: keyof typeof SIZES;
    className?: string;
}) {
    const reduce = useReducedMotion();
    const px = SIZES[size];

    const animate =
        reduce || mood === 'idle'
            ? undefined
            : mood === 'sad'
              ? { rotate: [0, -4, 4, 0] }
              : { y: [0, -8, 0], rotate: [0, -3, 3, 0] };

    const transition =
        mood === 'sad'
            ? { duration: 0.5 }
            : { duration: 0.6, repeat: mood === 'celebrate' ? 2 : 0 };

    return (
        <motion.svg
            width={px}
            height={px}
            viewBox="0 0 100 100"
            className={cn('select-none', className)}
            aria-hidden="true"
            animate={
                reduce
                    ? undefined
                    : mood === 'idle'
                      ? { y: [0, -4, 0] }
                      : animate
            }
            transition={
                mood === 'idle'
                    ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                    : transition
            }
        >
            {/* body */}
            <ellipse cx="50" cy="54" rx="34" ry="36" fill="var(--brand-primary)" />
            <ellipse cx="50" cy="60" rx="22" ry="22" fill="oklch(0.99 0.02 142)" opacity="0.85" />
            {/* eyes */}
            {mood === 'sad' ? (
                <>
                    <path d="M34 44 q5 -5 10 0" stroke="oklch(0.22 0.06 142)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M56 44 q5 -5 10 0" stroke="oklch(0.22 0.06 142)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </>
            ) : (
                <>
                    <circle cx="39" cy="46" r="5" fill="oklch(0.22 0.06 142)" />
                    <circle cx="61" cy="46" r="5" fill="oklch(0.22 0.06 142)" />
                    <circle cx="40.5" cy="44.5" r="1.6" fill="#fff" />
                    <circle cx="62.5" cy="44.5" r="1.6" fill="#fff" />
                </>
            )}
            {/* mouth */}
            {mood === 'sad' ? (
                <path d="M40 66 q10 -8 20 0" stroke="oklch(0.22 0.06 142)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            ) : (
                <path d="M40 60 q10 12 20 0" stroke="oklch(0.22 0.06 142)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
            {/* cheeks when happy */}
            {(mood === 'happy' || mood === 'celebrate') && (
                <>
                    <circle cx="30" cy="58" r="4" fill="var(--brand-pink)" opacity="0.5" />
                    <circle cx="70" cy="58" r="4" fill="var(--brand-pink)" opacity="0.5" />
                </>
            )}
        </motion.svg>
    );
}
