"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechRecognitionStatus = "idle" | "listening" | "error" | "denied";

/**
 * Minimal typings for the Web Speech API — it isn't in the standard DOM lib and
 * ships prefixed (`webkitSpeechRecognition`) in Chromium/Safari.
 */
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionResult {
    readonly length: number;
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
    readonly error: string;
    readonly message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** SSR-safe feature-detect — usable outside React (e.g. planning availability). */
export function isSpeechRecognitionSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
}

// The value never changes at runtime, so subscribe is a no-op. useSyncExternalStore
// gives an SSR-safe read (server = false, client = real) with no setState-in-effect.
const noopSubscribe = () => () => {};
/** React hook form of {@link isSpeechRecognitionSupported} — SSR-safe, no flicker. */
export function useSpeechRecognitionSupported(): boolean {
    return useSyncExternalStore(
        noopSubscribe,
        isSpeechRecognitionSupported,
        () => false,
    );
}

export interface UseSpeechRecognitionOptions {
    /**
     * Fired once each listening attempt ends (idle or a retryable error), with
     * the captured final results — the natural place to grade a spoken answer
     * without reacting to status changes inside an effect. Not fired when mic
     * permission is denied (a terminal state the caller handles via `status`).
     *
     * `heard` is false when nothing was recognised (silence / `no-speech`), so
     * the caller can prompt a retry instead of grading an empty answer wrong.
     */
    onEnd?: (result: {
        transcript: string;
        alternatives: string[];
        heard: boolean;
    }) => void;
    /** Recognition locale (BCP-47). Defaults to "en-US". */
    lang?: string;
    /**
     * Keep listening until `stop()` is called instead of ending at the first
     * pause. Used for press-and-hold recording. Defaults to false.
     */
    continuous?: boolean;
}

export interface UseSpeechRecognitionReturn {
    supported: boolean;
    status: SpeechRecognitionStatus;
    /** Best (top) final transcript captured so far. */
    transcript: string;
    /** Live, not-yet-final transcript for feedback while speaking. */
    interimTranscript: string;
    /** All final alternatives (up to maxAlternatives), best first. */
    alternatives: string[];
    start: () => void;
    stop: () => void;
    reset: () => void;
}

/**
 * Wraps the browser SpeechRecognition API for the speaking practice mode.
 * Feature-detects (SSR-safe), normalises the permission-denied error into a
 * dedicated `denied` status (vs. the retryable `no-speech`/`error`), and keeps
 * the recognizer instance across start/stop for the session.
 */
export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
    const supported = useSpeechRecognitionSupported();
    const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    // Latest final results captured this attempt, and the callback — kept in refs
    // so the recognizer's handlers always see current values without rebinding.
    const finalTranscriptRef = useRef("");
    const finalAlternativesRef = useRef<string[]>([]);
    const deniedRef = useRef(false);
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    const ensureRecognition = useCallback((): SpeechRecognitionInstance | null => {
        if (recognitionRef.current) return recognitionRef.current;
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) return null;

        const recognition = new Ctor();
        recognition.lang = optionsRef.current.lang ?? "en-US";
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.continuous = optionsRef.current.continuous ?? false;

        recognition.onstart = () => setStatus("listening");
        recognition.onresult = (event) => {
            let interim = "";
            let finalAlternatives: string[] = [];
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    const alts: string[] = [];
                    for (let j = 0; j < result.length; j++) {
                        alts.push(result[j].transcript);
                    }
                    finalAlternatives = alts;
                } else {
                    interim += result[0]?.transcript ?? "";
                }
            }
            setInterimTranscript(interim);
            if (finalAlternatives.length > 0) {
                finalTranscriptRef.current = finalAlternatives[0];
                finalAlternativesRef.current = finalAlternatives;
                setTranscript(finalAlternatives[0]);
                setAlternatives(finalAlternatives);
            }
        };
        recognition.onerror = (event) => {
            // 'not-allowed' / 'service-not-allowed' = mic permission blocked.
            // Everything else ('no-speech', 'aborted', 'audio-capture', 'network')
            // is retryable, so surface it as a generic error the user can retry.
            const denied =
                event.error === "not-allowed" || event.error === "service-not-allowed";
            deniedRef.current = denied;
            setStatus(denied ? "denied" : "error");
        };
        recognition.onend = () => {
            // Keep terminal 'denied'/'error' states; only listening returns to idle.
            setStatus((prev) => (prev === "listening" ? "idle" : prev));
            // Report the finished attempt (unless permission was denied), so the
            // caller can grade in an event callback rather than a status effect.
            if (!deniedRef.current) {
                const alts = finalAlternativesRef.current;
                optionsRef.current.onEnd?.({
                    transcript: finalTranscriptRef.current,
                    alternatives: alts,
                    heard: alts.some((a) => a.trim().length > 0),
                });
            }
        };

        recognitionRef.current = recognition;
        return recognition;
    }, []);

    const start = useCallback(() => {
        const recognition = ensureRecognition();
        if (!recognition) return;
        finalTranscriptRef.current = "";
        finalAlternativesRef.current = [];
        deniedRef.current = false;
        setTranscript("");
        setInterimTranscript("");
        setAlternatives([]);
        try {
            recognition.start();
        } catch {
            // start() throws if it's already running — safe to ignore.
        }
    }, [ensureRecognition]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const reset = useCallback(() => {
        recognitionRef.current?.abort();
        setStatus("idle");
        setTranscript("");
        setInterimTranscript("");
        setAlternatives([]);
    }, []);

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            recognitionRef.current = null;
        };
    }, []);

    return {
        supported,
        status,
        transcript,
        interimTranscript,
        alternatives,
        start,
        stop,
        reset,
    };
}
