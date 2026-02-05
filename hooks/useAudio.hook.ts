import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioReturn {
    isPlaying: boolean;
    error: string | null;
    play: (url: string) => void;
    stop: () => void;
    clearError: () => void;
}

/**
 * Custom hook for playing audio from URLs
 * Handles loading, playing, errors, and cleanup
 */
export const useAudio = (): UseAudioReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
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

        // Stop and cleanup previous audio if exists
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Create new audio element
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onloadstart = () => {
            setIsPlaying(true);
        };

        audio.onplay = () => {
            setIsPlaying(true);
        };

        audio.onended = () => {
            setIsPlaying(false);
            audioRef.current = null;
        };

        audio.onerror = () => {
            setIsPlaying(false);
            setError('Failed to load audio. Check the URL');
            audioRef.current = null;
        };

        audio.onpause = () => {
            setIsPlaying(false);
        };

        // Play the audio
        audio.play().catch((err) => {
            console.error('Error playing audio:', err);
            setIsPlaying(false);
            setError('Unable to play audio');
            audioRef.current = null;
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
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
