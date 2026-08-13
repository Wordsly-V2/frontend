import { useCallback, useEffect, useRef, useState } from 'react';
import { playAudioUrl } from '@/lib/practice-audio';

interface UseAudioReturn {
    isPlaying: boolean;
    error: string | null;
    play: (url: string) => void;
    stop: () => void;
    clearError: () => void;
}

/**
 * Play an audio url with `isPlaying` / `error` state — for the audio-url fields
 * in the manage forms, where the learner needs to hear whether a url works.
 *
 * Playback itself is delegated to the shared player in `lib/practice-audio`, so
 * two instances of this hook (word audio + example audio) and every other audio
 * in the app take turns instead of talking over each other. Losing the player to
 * something else reports as a plain stop, which clears `isPlaying` — otherwise
 * the button would stay disabled with nothing playing.
 */
export const useAudio = (): UseAudioReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);
    /** Identifies the latest `play` call, so a superseded one can't set state. */
    const playIdRef = useRef(0);

    const stop = useCallback(() => {
        cancelRef.current?.();
        cancelRef.current = null;
        setIsPlaying(false);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const play = useCallback((url: string) => {
        if (!url.trim()) {
            setError('Please enter an audio URL first');
            return;
        }

        setError(null);
        const playId = ++playIdRef.current;
        // Starting this playback stops the previous one, whose `onFinish` runs
        // synchronously — the id check keeps that from clearing our state.
        let settled = false;
        const cancel = playAudioUrl(url, {
            onFinish: (reason) => {
                settled = true;
                if (playId !== playIdRef.current) return;
                cancelRef.current = null;
                setIsPlaying(false);
                if (reason === 'error') {
                    setError('Failed to load audio. Check the URL');
                }
            },
        });
        // A url that fails immediately is already over — never show it as playing.
        if (settled) return;
        cancelRef.current = cancel;
        setIsPlaying(true);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelRef.current?.();
            cancelRef.current = null;
        };
    }, []);

    return {
        isPlaying,
        error,
        play,
        stop,
        clearError,
    };
};
