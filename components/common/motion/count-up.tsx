'use client';

import { useEffect } from 'react';
import {
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from 'motion/react';

/** Animated number that counts up to `value` on mount / value change. */
export function CountUp({
    value,
    duration = 0.9,
    className,
    suffix = '',
    prefix = '',
}: {
    value: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}) {
    const reduce = useReducedMotion();
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) =>
        `${prefix}${Math.round(latest)}${suffix}`,
    );

    useEffect(() => {
        if (reduce) {
            count.set(value);
            return;
        }
        const controls = animate(count, value, { duration, ease: 'easeOut' });
        return () => controls.stop();
    }, [value, duration, reduce, count]);

    return <motion.span className={className}>{rounded}</motion.span>;
}
