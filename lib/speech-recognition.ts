/**
 * The browser's speech recogniser (Web Speech API), detected without React so
 * the practice planner can ask whether speaking exercises can run at all.
 */

// The Web Speech API isn't in TypeScript's DOM lib; only what we use.
interface RecognitionAlternative {
    transcript: string;
}
interface RecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
    readonly resultIndex: number;
    readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
export interface Recognition {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onaudiostart: (() => void) | null;
    onresult: ((event: RecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}
export type RecognitionConstructor = new () => Recognition;

export function recognitionConstructor(): RecognitionConstructor | undefined {
    if (typeof globalThis.window === "undefined") return undefined;
    const w = globalThis.window as unknown as {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
    return recognitionConstructor() !== undefined;
}

/**
 * WebKit's Audio Session API (Safari 17+, iOS 17+). Recognition needs the
 * session in "play-and-record"; after the page played audio, iOS can leave it
 * in playback and recognition then hears nothing, with no error.
 */
interface AudioSession {
    type: string;
}

export function audioSession(): AudioSession | undefined {
    if (typeof navigator === "undefined") return undefined;
    return (navigator as unknown as { audioSession?: AudioSession }).audioSession;
}

const DEBUG_KEY = "wordsly:speech-debug";

/**
 * Whether to show the recogniser's event log on screen, for finding out on a
 * phone why speaking fails. `?speechDebug=1` turns it on for the tab,
 * `?speechDebug=0` off.
 */
export function speechDebugEnabled(): boolean {
    if (typeof globalThis.window === "undefined") return false;
    try {
        const flag = new URLSearchParams(globalThis.location.search).get("speechDebug");
        if (flag === "1") sessionStorage.setItem(DEBUG_KEY, "1");
        if (flag === "0") sessionStorage.removeItem(DEBUG_KEY);
        return sessionStorage.getItem(DEBUG_KEY) === "1";
    } catch {
        return false;
    }
}

/** Why listening stopped, as far as the fallback message cares. */
export type SpeechFallbackError = "not-allowed" | "service-not-allowed" | "audio-capture" | "network" | "stuck";

/**
 * One short sentence saying why the learner is checking themselves, or null
 * when there is nothing worth saying. A "network" error while the device is
 * online almost always means the browser has no speech service: Chromium
 * browsers other than Google Chrome (Cốc Cốc, Brave, Arc…) expose the API but
 * every attempt fails with "network". Blaming the connection then is wrong.
 */
export function speechFallbackCause(
    error: string | null | undefined,
    online: boolean,
): string | null {
    switch (error) {
        case "not-allowed":
            return "The microphone is off.";
        case "service-not-allowed":
            return "Speech check is off on this device. On iPhone, turn on Dictation.";
        case "audio-capture":
            return "No microphone found.";
        case "stuck":
            return "Speech check isn't responding on this device.";
        case "network":
            return online
                ? "This browser can't check speech. Google Chrome can."
                : "Speech check needs a connection.";
        default:
            return null;
    }
}
