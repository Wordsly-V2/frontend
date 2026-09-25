"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Speech to text through the browser's Web Speech API (Chrome, Edge, Safari;
 * not Firefox). Chrome sends the audio to Google, so it needs a connection.
 *
 * One `start()` listens for one utterance. The result is the recogniser's
 * alternatives, best guess first, for `scoreSpeech` to pick from. Callers must
 * offer a way through without it: `supported` is false on some browsers, and a
 * learner may refuse the microphone (`error === "not-allowed"`).
 */

/** Why listening stopped without a result. */
export type SpeechRecognitionErrorCode =
    | "not-allowed" // microphone refused, or the page isn't allowed to use it
    | "no-speech" // nothing heard before the recogniser gave up
    | "audio-capture" // no microphone
    | "network" // recognition needs a connection
    | "aborted"
    | "other";

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
interface Recognition {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    onresult: ((event: RecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | undefined {
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

function toErrorCode(error: string): SpeechRecognitionErrorCode {
    switch (error) {
        case "not-allowed":
        case "service-not-allowed":
            return "not-allowed";
        case "no-speech":
        case "audio-capture":
        case "network":
        case "aborted":
            return error;
        default:
            return "other";
    }
}

const subscribeNever = () => () => {};

export interface SpeechRecognitionState {
    /** The browser can recognise speech at all (false during SSR). */
    supported: boolean;
    listening: boolean;
    /** What has been heard so far, while listening. */
    interim: string;
    /** Alternatives for the last utterance, best first; null until one is heard. */
    transcripts: string[] | null;
    error: SpeechRecognitionErrorCode | null;
    start: () => void;
    stop: () => void;
    /** Clears the last result and error. */
    reset: () => void;
}

export function useSpeechRecognition({
    lang = "en-US",
    maxAlternatives = 3,
}: { lang?: string; maxAlternatives?: number } = {}): SpeechRecognitionState {
    const supported = useSyncExternalStore(
        subscribeNever,
        isSpeechRecognitionSupported,
        () => false,
    );
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [transcripts, setTranscripts] = useState<string[] | null>(null);
    const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null);
    const recognitionRef = useRef<Recognition | null>(null);

    const stop = useCallback(() => recognitionRef.current?.stop(), []);

    const reset = useCallback(() => {
        setInterim("");
        setTranscripts(null);
        setError(null);
    }, []);

    const start = useCallback(() => {
        const Ctor = recognitionConstructor();
        if (!Ctor || recognitionRef.current) return;

        const recognition = new Ctor();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = maxAlternatives;

        let heard: string[] | null = null;
        let failed = false;

        recognition.onresult = (event) => {
            let live = "";
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    heard = Array.from({ length: result.length }, (_, k) => result[k].transcript.trim())
                        .filter(Boolean);
                } else {
                    live += result[0].transcript;
                }
            }
            setInterim(live.trim());
        };
        recognition.onerror = (event) => {
            failed = true;
            setError(toErrorCode(event.error));
        };
        recognition.onend = () => {
            recognitionRef.current = null;
            setListening(false);
            setInterim("");
            if (heard && heard.length > 0) setTranscripts(heard);
            else if (!failed) setError("no-speech");
        };

        reset();
        recognitionRef.current = recognition;
        setListening(true);
        try {
            recognition.start();
        } catch {
            // Throws if a previous session is still closing; treat as a miss.
            recognitionRef.current = null;
            setListening(false);
            setError("other");
        }
    }, [lang, maxAlternatives, reset]);

    // Never keep the microphone open after the step is gone.
    useEffect(
        () => () => {
            const recognition = recognitionRef.current;
            if (!recognition) return;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort();
            recognitionRef.current = null;
        },
        [],
    );

    return { supported, listening, interim, transcripts, error, start, stop, reset };
}
