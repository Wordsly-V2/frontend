/**
 * Lightweight celebration burst — use sparingly (e.g. session complete).
 */
export function fireCelebrationConfetti(): void {
    if (globalThis.window === undefined) return;
    void import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        const count = 200;
        const defaults = { origin: { y: 0.65 } };

        function fire(particleRatio: number, opts: Record<string, unknown>) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    });
}
