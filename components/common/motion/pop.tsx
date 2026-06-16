'use client';

import { motion, useReducedMotion } from 'motion/react';

/** Spring scale-in. Use for success panels, earned badges, reveals. */
export function Pop({
    children,
    className,
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const reduce = useReducedMotion();

    if (reduce) return <div className={className}>{children}</div>;

    return (
        <motion.div
            className={className}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18, delay }}
        >
            {children}
        </motion.div>
    );
}
