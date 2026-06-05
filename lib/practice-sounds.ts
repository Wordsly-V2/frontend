let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
        try {
            audioContext = new AudioContext();
        } catch {
            return null;
        }
    }
    return audioContext;
}

function playTone(frequency: number, durationMs: number, volume = 0.08): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playPracticeSuccessSound(): void {
    playTone(880, 90, 0.06);
    setTimeout(() => playTone(1174, 110, 0.05), 70);
}

export function playPracticeErrorSound(): void {
    playTone(220, 140, 0.07);
}
