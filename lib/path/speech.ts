/**
 * Text-to-speech for Path sentences and dialogue lines, via the browser's
 * `speechSynthesis` (en-US). Single words that have a dictionary audio URL
 * should still play that file; this is for everything else.
 */

const LANG = "en-US";

export function canSpeak(): boolean {
    return typeof globalThis.speechSynthesis !== "undefined";
}

function pickVoice(): SpeechSynthesisVoice | undefined {
    const voices = globalThis.speechSynthesis.getVoices();
    return (
        voices.find((v) => v.lang === LANG && v.localService) ??
        voices.find((v) => v.lang === LANG) ??
        voices.find((v) => v.lang.startsWith("en"))
    );
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
