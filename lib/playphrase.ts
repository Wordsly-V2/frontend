/**
 * PlayPhrase.me — movie clips with phrases containing a word/phrase.
 * No API; we link to their search page. See: https://www.playphrase.me/
 */

const PLAYPHRASE_BASE = "https://www.playphrase.me/#/search";

export interface PlayPhraseSearchOptions {
  /** Search query (word or phrase). */
  q: string;
  /** Result position (default 0). */
  pos?: number;
  /** Language code (default "en"). */
  language?: string;
}

/**
 * Builds the PlayPhrase.me search URL for a word or phrase.
 * Opens in a new tab so learners can watch movie clips using that word.
 */
export function getPlayPhraseSearchUrl(
  wordOrPhrase: string,
  options: Partial<PlayPhraseSearchOptions> = {}
): string {
  const q = (wordOrPhrase ?? "").trim();
  if (!q) return PLAYPHRASE_BASE;

  const params = new URLSearchParams({
    q,
    pos: String(options.pos ?? 0),
    language: options.language ?? "en",
  });

  return `${PLAYPHRASE_BASE}?${params.toString()}`;
}
