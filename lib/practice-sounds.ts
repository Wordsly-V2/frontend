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
    // Browsers suspend the context until a user gesture; resume on demand.
    if (audioContext.state === "suspended") {
        void audioContext.resume();
    }
    return audioContext;
}

interface NoteOptions {
    /** Seconds from "now" to start the note. */
    delay?: number;
    /** Note length in seconds. */
    duration?: number;
    type?: OscillatorType;
    /** Peak gain (0–1). */
    peak?: number;
}

/**
 * Play a single note with a smooth attack/decay envelope so there are no
 * clicks at the edges (the old version started/stopped a raw oscillator,
 * which popped).
 */
function playNote(frequency: number, options: NoteOptions = {}): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    const { delay = 0, duration = 0.16, type = "triangle", peak = 0.12 } = options;
    const start = ctx.currentTime + delay;
    const end = start + duration;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    // Envelope: quick fade-in, exponential fade-out to silence.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
}

/** Bright, rewarding ascending arpeggio (C5 → E5 → G5 → C6). */
export function playPracticeSuccessSound(): void {
    playNote(523.25, { delay: 0, duration: 0.12, peak: 0.1 });
    playNote(659.25, { delay: 0.08, duration: 0.12, peak: 0.1 });
    playNote(783.99, { delay: 0.16, duration: 0.12, peak: 0.1 });
    playNote(1046.5, { delay: 0.24, duration: 0.22, peak: 0.12 });
}

/** Soft, non-harsh descending two-note "not quite" cue. */
export function playPracticeErrorSound(): void {
    playNote(311.13, { delay: 0, duration: 0.16, type: "sine", peak: 0.09 });
    playNote(233.08, { delay: 0.12, duration: 0.22, type: "sine", peak: 0.08 });
}

/** Triumphant rising fanfare (C5 → E5 → G5 → C6 → E6) for a level-up. */
export function playLevelUpSound(): void {
    playNote(523.25, { delay: 0, duration: 0.14, peak: 0.11 });
    playNote(659.25, { delay: 0.1, duration: 0.14, peak: 0.11 });
    playNote(783.99, { delay: 0.2, duration: 0.14, peak: 0.11 });
    playNote(1046.5, { delay: 0.3, duration: 0.16, peak: 0.12 });
    playNote(1318.51, { delay: 0.44, duration: 0.32, peak: 0.13 });
}
