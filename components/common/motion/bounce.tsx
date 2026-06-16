'use client';

import { motion, useReducedMotion } from 'motion/react';

/** Hover-lift + tap-squish wrapper for clickable cards/tiles. */
export function Bounce({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const reduce = useReducedMotion();

    if (reduce) return <div className={className}>{children}</div>;

    return (
        <motion.div
            className={className}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
            {children}
        </motion.div>
    );
}
