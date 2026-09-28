"use client";

import {
    isSpeechRecognitionSupported,
    type Recognition,
    recognitionConstructor,
} from "@/lib/speech-recognition";
import { stopSpeaking } from "@/lib/path/speech";
import { stopAudio } from "@/lib/practice-audio";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Speech to text through the browser's Web Speech API (Chrome, Edge, Safari;
 * not Firefox). Chrome sends the audio to Google, so it needs a connection.
 * On iOS every browser is WebKit underneath and uses Apple's dictation, which
 * must be switched on in Settings.
 *
 * One `start()` listens for one utterance, for up to {@link LISTEN_WINDOW_MS}
 * while nothing has been heard (restarting a recogniser that gave up early). The result is the recogniser's
 * alternatives, best guess first, for `scoreSpeech` to pick from. Callers must
 * offer a way through without it: `supported` is false on some browsers, and a
 * learner may refuse the microphone (`error === "not-allowed"`).
 */

/** Why listening stopped without a result. */
export type SpeechRecognitionErrorCode =
    | "not-allowed" // microphone refused, or the page isn't allowed to use it
    | "service-not-allowed" // the browser's speech service is off (iOS: Dictation disabled)
    | "no-speech" // nothing heard before the recogniser gave up
    | "audio-capture" // no microphone
    | "network" // recognition needs a connection
    | "aborted"
    | "other";

function toErrorCode(error: string): SpeechRecognitionErrorCode {
    switch (error) {
        case "no-match": // Android: the recogniser ended having heard nothing usable
            return "no-speech";
        case "not-allowed":
        case "service-not-allowed":
        case "no-speech":
        case "audio-capture":
        case "network":
        case "aborted":
            return error;
        default:
            return "other";
    }
}

/** Errors after which listening again, within the window, may still work. */
const RETRYABLE_ERRORS = new Set<SpeechRecognitionErrorCode>(["no-speech", "aborted", "other"]);
/** How long one tap keeps listening while nothing has been heard. */
const LISTEN_WINDOW_MS = 8000;
const MAX_RESTARTS = 4;
const RESTART_DELAY_MS = 150;

const subscribeNever = () => () => {};

/**
 * Detaches and aborts a recogniser. WebKit (Safari, every iOS browser) can keep
 * the microphone capturing after a session ended by itself, so the iPhone's
 * mic indicator stays on until Safari is closed; an explicit abort releases it.
 * Aborting one that already ended is a no-op elsewhere.
 */
function release(recognition: Recognition): void {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
        recognition.abort();
    } catch {
        // already gone
    }
}

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
    /** The current listening window; `stop()` and unmount close it. */
    const sessionRef = useRef<{ closed: boolean; timer?: ReturnType<typeof setTimeout> } | null>(null);

    const stop = useCallback(() => {
        const session = sessionRef.current;
        if (!session) return;
        session.closed = true;
        clearTimeout(session.timer);
        if (recognitionRef.current) recognitionRef.current.stop();
        else {
            // Between two restarts: nothing is running, so end the window here.
            sessionRef.current = null;
            setListening(false);
            setInterim("");
        }
    }, []);

    const reset = useCallback(() => {
        setInterim("");
        setTranscripts(null);
        setError(null);
    }, []);

    const start = useCallback(() => {
        const Ctor = recognitionConstructor();
        if (!Ctor || sessionRef.current) return;

        const session: { closed: boolean; timer?: ReturnType<typeof setTimeout> } = { closed: false };
        sessionRef.current = session;
        const deadline = Date.now() + LISTEN_WINDOW_MS;
        let restarts = 0;

        const finish = (result: string[] | null, code: SpeechRecognitionErrorCode | null) => {
            if (sessionRef.current === session) sessionRef.current = null;
            recognitionRef.current = null;
            setListening(false);
            setInterim("");
            if (result) setTranscripts(result);
            else setError(code ?? "no-speech");
        };

        const run = () => {
            const recognition = new Ctor();
            recognition.lang = lang;
            recognition.interimResults = true;
            recognition.continuous = false;
            recognition.maxAlternatives = maxAlternatives;

            let heard: string[] | null = null;
            // WebKit (Safari, every iOS browser) and some Android builds can end
            // without ever marking a result final; the last interim is the answer.
            let lastInterim = "";
            let failure: SpeechRecognitionErrorCode | null = null;

            recognition.onresult = (event) => {
                let live = "";
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        heard = Array.from({ length: result.length }, (_, k) => result[k].transcript.trim())
                            .filter(Boolean);
                        // Have the answer: don't wait for the recogniser's own
                        // end of speech with the microphone still open.
                        recognition.stop();
                    } else {
                        live += result[0].transcript;
                    }
                }
                live = live.trim();
                if (live) lastInterim = live;
                setInterim(live);
            };
            recognition.onerror = (event) => {
                failure = toErrorCode(event.error);
            };
            recognition.onend = () => {
                recognitionRef.current = null;
                release(recognition);
                if (heard && heard.length > 0) return finish(heard, null);
                if (lastInterim) return finish([lastInterim], null);
                // Chrome on Android gives up a second or two after its beep (or
                // aborts at once) when nothing was said yet; keep the window
                // open by listening again rather than ending the learner's try.
                const retry = failure === null || RETRYABLE_ERRORS.has(failure);
                if (!session.closed && retry && restarts < MAX_RESTARTS && Date.now() < deadline) {
                    restarts++;
                    session.timer = setTimeout(() => {
                        if (!session.closed) run();
                    }, RESTART_DELAY_MS);
                    return;
                }
                finish(null, failure);
            };

            recognitionRef.current = recognition;
            try {
                recognition.start();
            } catch {
                // Throws if a previous session is still closing; treat as a miss.
                recognitionRef.current = null;
                release(recognition);
                finish(null, "other");
            }
        };

        // The recogniser would hear the app's own voice, and on Android playing
        // media can take the audio focus away from it.
        stopAudio();
        stopSpeaking();
        reset();
        setListening(true);
        run();
    }, [lang, maxAlternatives, reset]);

    // Never keep the microphone open after the step is gone, or while the page
    // is in the background (iOS would keep it on until Safari is closed).
    useEffect(() => {
        const abortAll = () => {
            const session = sessionRef.current;
            if (session) {
                session.closed = true;
                clearTimeout(session.timer);
                sessionRef.current = null;
            }
            const recognition = recognitionRef.current;
            recognitionRef.current = null;
            if (recognition) release(recognition);
            setListening(false);
            setInterim("");
        };
        const onHidden = () => {
            if (document.visibilityState === "hidden") abortAll();
        };
        globalThis.addEventListener("pagehide", abortAll);
        document.addEventListener("visibilitychange", onHidden);
        return () => {
            globalThis.removeEventListener("pagehide", abortAll);
            document.removeEventListener("visibilitychange", onHidden);
            abortAll();
        };
    }, []);

    return { supported, listening, interim, transcripts, error, start, stop, reset };
}
