"use client";

import {
    audioSession,
    isSpeechRecognitionSupported,
    type Recognition,
    recognitionConstructor,
    speechDebugEnabled,
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
 *
 * WebKit is unreliable about ending: it can keep listening after a result
 * without ever sending `end`, or never start at all once the page has played
 * audio. So listening is also ended by timers here, never only by the
 * recogniser: no `start` within {@link START_TIMEOUT_MS} is `"stuck"`, words
 * followed by {@link SETTLE_MS} of nothing new are the answer, and a `stop()`
 * that gets no `end` within {@link END_GRACE_MS} ends anyway.
 */

/** Why listening stopped without a result. */
export type SpeechRecognitionErrorCode =
    | "not-allowed" // microphone refused, or the page isn't allowed to use it
    | "service-not-allowed" // the browser's speech service is off (iOS: Dictation disabled)
    | "no-speech" // nothing heard before the recogniser gave up
    | "audio-capture" // no microphone
    | "network" // recognition needs a connection
    | "stuck" // the recogniser never started (WebKit after audio playback)
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
/** No `start` event this long after `start()`: the recogniser is stuck. */
const START_TIMEOUT_MS = 4000;
/** Words heard, then nothing new for this long: that was the answer. */
const SETTLE_MS = 2000;
/** After asking the recogniser to stop, how long to wait for its `end`. */
const END_GRACE_MS = 1000;
/** Debug lines kept on screen. */
const DEBUG_LINES = 30;

const subscribeNever = () => () => {};

/**
 * Detaches and aborts a recogniser. WebKit (Safari, every iOS browser) can keep
 * the microphone capturing after a session ended by itself, so the iPhone's
 * mic indicator stays on until Safari is closed; an explicit abort releases it.
 * Aborting one that already ended is a no-op elsewhere.
 */
function release(recognition: Recognition): void {
    recognition.onstart = null;
    recognition.onaudiostart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
        recognition.abort();
    } catch {
        // already gone
    }
}

/**
 * One recogniser while it runs: `stop` asks it to end and makes sure it does,
 * `cancel` drops it without reporting anything.
 */
interface ActiveRun {
    stop: () => void;
    cancel: () => void;
}

interface Session {
    closed: boolean;
    timer?: ReturnType<typeof setTimeout>;
    /** The audio session type to put back when listening ends. */
    previousAudioSession?: string;
}

/** Puts the page's audio session back the way it was before listening. */
function restoreAudioSession(session: Session): void {
    const audio = audioSession();
    if (!audio || session.previousAudioSession === undefined) return;
    try {
        audio.type = session.previousAudioSession;
    } catch {
        // read-only in some builds
    }
    session.previousAudioSession = undefined;
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
    /** The recogniser's events, with `?speechDebug=1`; null otherwise. */
    debugLog: string[] | null;
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
    const debug = useSyncExternalStore(subscribeNever, speechDebugEnabled, () => false);
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [transcripts, setTranscripts] = useState<string[] | null>(null);
    const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const runRef = useRef<ActiveRun | null>(null);
    /** The current listening window; `stop()` and unmount close it. */
    const sessionRef = useRef<Session | null>(null);
    const startedAtRef = useRef(0);

    const trace = useCallback(
        (message: string) => {
            if (!debug) return;
            const at = ((Date.now() - startedAtRef.current) / 1000).toFixed(1);
            console.info("[speech]", at, message);
            setDebugLog((lines) => [...lines.slice(-(DEBUG_LINES - 1)), `${at}s ${message}`]);
        },
        [debug],
    );

    const stop = useCallback(() => {
        const session = sessionRef.current;
        if (!session) return;
        session.closed = true;
        clearTimeout(session.timer);
        if (runRef.current) runRef.current.stop();
        else {
            // Between two restarts: nothing is running, so end the window here.
            sessionRef.current = null;
            restoreAudioSession(session);
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

        const session: Session = { closed: false };
        sessionRef.current = session;
        startedAtRef.current = Date.now();
        const deadline = Date.now() + LISTEN_WINDOW_MS;
        let restarts = 0;

        const finish = (result: string[] | null, code: SpeechRecognitionErrorCode | null) => {
            if (sessionRef.current === session) sessionRef.current = null;
            runRef.current = null;
            restoreAudioSession(session);
            trace(result ? `done: ${JSON.stringify(result)}` : `failed: ${code ?? "no-speech"}`);
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
            let started = false;
            let ended = false;
            let stopping = false;
            const timers: Partial<Record<"start" | "settle" | "end" | "window", ReturnType<typeof setTimeout>>> = {};
            const clearTimers = () => Object.values(timers).forEach((t) => clearTimeout(t));

            const conclude = () => {
                if (ended) return;
                ended = true;
                clearTimers();
                if (runRef.current === active) runRef.current = null;
                release(recognition);
                if (heard && heard.length > 0) return finish(heard, null);
                if (lastInterim) return finish([lastInterim], null);
                // Chrome on Android gives up a second or two after its beep (or
                // aborts at once) when nothing was said yet; keep the window
                // open by listening again rather than ending the learner's try.
                const retry = failure === null || RETRYABLE_ERRORS.has(failure);
                if (!session.closed && retry && restarts < MAX_RESTARTS && Date.now() < deadline) {
                    restarts++;
                    trace(`restart ${restarts}`);
                    session.timer = setTimeout(() => {
                        if (!session.closed) run();
                    }, RESTART_DELAY_MS);
                    return;
                }
                finish(null, failure);
            };

            // Ask the recogniser to end, and end anyway if its `end` never comes.
            const stopRun = () => {
                if (ended) return;
                if (!stopping) {
                    stopping = true;
                    trace("stop");
                    try {
                        recognition.stop();
                    } catch {
                        // already stopping
                    }
                }
                clearTimeout(timers.end);
                timers.end = setTimeout(() => {
                    trace("no end event, ending");
                    conclude();
                }, END_GRACE_MS);
            };

            const onStarted = (event: string) => () => {
                trace(event);
                started = true;
                clearTimeout(timers.start);
            };
            recognition.onstart = onStarted("start");
            recognition.onaudiostart = onStarted("audiostart");
            recognition.onresult = (event) => {
                started = true;
                clearTimeout(timers.start);
                clearTimeout(timers.window);
                let live = "";
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        heard = Array.from({ length: result.length }, (_, k) => result[k].transcript.trim())
                            .filter(Boolean);
                        // Have the answer: don't wait for the recogniser's own
                        // end of speech with the microphone still open.
                        stopRun();
                    } else {
                        live += result[0].transcript;
                    }
                }
                live = live.trim();
                trace(heard ? `final: ${JSON.stringify(heard)}` : `interim: ${live}`);
                if (live) lastInterim = live;
                setInterim(live);
                if (!heard && lastInterim) {
                    clearTimeout(timers.settle);
                    timers.settle = setTimeout(stopRun, SETTLE_MS);
                }
            };
            recognition.onerror = (event) => {
                trace(`error: ${event.error}`);
                failure = toErrorCode(event.error);
            };
            recognition.onend = () => {
                trace("end");
                conclude();
            };

            const active: ActiveRun = {
                stop: stopRun,
                cancel: () => {
                    ended = true;
                    clearTimers();
                    release(recognition);
                },
            };
            runRef.current = active;
            try {
                recognition.start();
            } catch (e) {
                // Throws if a previous session is still closing; treat as a miss.
                trace(`start threw: ${e instanceof Error ? e.message : String(e)}`);
                runRef.current = null;
                release(recognition);
                finish(null, "other");
                return;
            }
            timers.start = setTimeout(() => {
                if (started) return;
                trace("never started");
                failure = "stuck";
                conclude();
            }, START_TIMEOUT_MS);
            // Nothing heard by the end of the window: stop rather than trust the
            // recogniser to give up on its own.
            timers.window = setTimeout(stopRun, Math.max(0, deadline - Date.now()) + END_GRACE_MS);
        };

        // The recogniser would hear the app's own voice, and on Android playing
        // media can take the audio focus away from it.
        stopAudio();
        stopSpeaking();
        // iOS leaves the audio session in playback after the page played sound,
        // and recognition then silently hears nothing.
        const audio = audioSession();
        if (audio) {
            session.previousAudioSession = audio.type;
            try {
                audio.type = "play-and-record";
            } catch {
                session.previousAudioSession = undefined;
            }
        }
        reset();
        setDebugLog([]);
        trace(
            `listen (${Ctor.name || "recogniser"}, audioSession ${session.previousAudioSession ?? "n/a"}, ${navigator.userAgent})`,
        );
        setListening(true);
        run();
    }, [lang, maxAlternatives, reset, trace]);

    // Never keep the microphone open after the step is gone, or while the page
    // is in the background (iOS would keep it on until Safari is closed).
    useEffect(() => {
        const abortAll = () => {
            const session = sessionRef.current;
            if (session) {
                session.closed = true;
                clearTimeout(session.timer);
                sessionRef.current = null;
                restoreAudioSession(session);
            }
            const run = runRef.current;
            runRef.current = null;
            run?.cancel();
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

    return {
        supported,
        listening,
        interim,
        transcripts,
        error,
        debugLog: debug ? debugLog : null,
        start,
        stop,
        reset,
    };
}
