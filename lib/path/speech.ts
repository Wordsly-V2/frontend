/**
 * Text-to-speech for Path sentences and dialogue lines, via the browser's
 * `speechSynthesis` (en-US). Single words that have a dictionary audio URL
 * should still play that file; this is for everything else.
 */

const LANG = "en-US";

/**
 * Clear American voices, best first, matched against `voice.name`. The browser
 * lists voices in no useful order: on macOS the first local en-US voice is
 * usually "Albert" (a croaky robot) or a novelty voice, which is why picking
 * "the first en-US voice" sounded noisy.
 */
const PREFERRED: RegExp[] = [
    /Microsoft (Ava|Andrew|Emma|Brian|Aria|Jenny|Guy|Michelle).*Natural/i, // Edge neural
    /Google US English/i, // Chrome
    /(Samantha|Ava|Allison|Susan|Tom|Evan|Nathan|Zoe).*(Premium|Enhanced)/i, // macOS downloaded
    /\b(Ava|Evan|Zoe|Nathan|Allison|Susan|Tom)\b/i, // macOS / iOS
    /\bSamantha\b/i,
    /Microsoft (Zira|David|Mark)/i, // Windows classic
];

/** Novelty and low-quality voices never worth picking. */
const BLOCKED =
    /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Princess|Deranged|Hysterical|Pipe Organ|eSpeak)\b/i;

let cachedVoice: SpeechSynthesisVoice | undefined;

export function canSpeak(): boolean {
    return typeof globalThis.speechSynthesis !== "undefined";
}

function isUs(v: SpeechSynthesisVoice): boolean {
    return v.lang.replace("_", "-").toLowerCase() === LANG.toLowerCase();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
    if (cachedVoice) return cachedVoice;
    const voices = globalThis.speechSynthesis.getVoices().filter((v) => !BLOCKED.test(v.name));
    const us = voices.filter(isUs);
    for (const pattern of PREFERRED) {
        const match = us.find((v) => pattern.test(v.name));
        if (match) return (cachedVoice = match);
    }
    // Voices may not be loaded yet: don't cache a fallback.
    return us[0] ?? voices.find((v) => v.lang.startsWith("en"));
}

// Chrome loads its voice list asynchronously: re-pick once it arrives.
if (canSpeak()) {
    globalThis.speechSynthesis.addEventListener?.("voiceschanged", () => {
        cachedVoice = undefined;
    });
}

/** Speaks `text`, cancelling anything already speaking. */
export function speak(text: string, options: { rate?: number } = {}): void {
    if (!canSpeak() || !text.trim()) return;
    const synth = globalThis.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;
    utterance.rate = options.rate ?? 0.95;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
}

export function stopSpeaking(): void {
    if (canSpeak()) globalThis.speechSynthesis.cancel();
}
