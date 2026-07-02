/**
 * Shared error handler for best-effort, fire-and-forget pronunciation playback.
 *
 * `HTMLMediaElement.play()` rejects for reasons that are entirely expected for
 * short audio clips — autoplay policy, no preceding user gesture, or playback
 * being interrupted by a newer clip (NotAllowedError / AbortError). Those are
 * intentionally swallowed so they never reach the user or the production
 * console. Genuinely unexpected failures are logged in development only.
 *
 * Replaces the `audio.play().catch(console.error)` boilerplate that was
 * duplicated across the practice/vocabulary components.
 */
export function handleAudioPlayError(error: unknown): void {
	const name = (error as { name?: string } | null)?.name;
	if (name === 'NotAllowedError' || name === 'AbortError') return;

	if (process.env.NODE_ENV !== 'production') {
		console.debug('Audio playback failed:', error);
	}
}
