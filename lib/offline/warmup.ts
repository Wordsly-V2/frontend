import { getCourseDetailById } from "@/apis/courses.api";
import {
	getDueWordIdsByWordIds,
	getProgressByWordIds,
} from "@/apis/word-progress.api";
import { getWordsByIds } from "@/apis/words.api";
import {
	readDueWordsLimitFromStorage,
	readNewWordsLimitFromStorage,
} from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { queryKeys } from "@/lib/query-keys";
import { SESSION_CRITICAL_GC_TIME } from "@/lib/queryClient";
import type { IWord } from "@/types/courses/courses.type";
import type { QueryClient } from "@tanstack/react-query";
import { readMeta, writeMeta } from "./idb";
import { requestMediaCaching } from "./media-cache";

/**
 * Fill the offline cache while there is still a connection.
 *
 * The learner never asks for this: the point is that opening the app on a train
 * with no signal just works. So it runs quietly on idle, targets the course they
 * were last using, and stays inside a budget — this is a background nicety, not
 * something worth spending someone's mobile data or storage quota on.
 */

const WARM_META_KEY = "warmedAt";

/** Roughly three sessions' worth, with headroom. */
export const WARM_MAX_WORDS = 60;
export const WARM_MAX_MEDIA_URLS = 200;

/** Don't re-warm more often than this. */
const WARM_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Skip the media pass entirely when storage is already this full. */
const STORAGE_PRESSURE_RATIO = 0.8;

export interface OfflinePool {
	courseId: string;
	courseName: string;
	wordIds: string[];
	warmedAt: string;
}

let isWarming = false;

export async function shouldWarm(nowMs = Date.now()): Promise<boolean> {
	if (isWarming) return false;

	// Respect an explicit "save data" preference and genuinely slow links.
	const connection = (
		navigator as Navigator & {
			connection?: { saveData?: boolean; effectiveType?: string };
		}
	).connection;
	if (connection?.saveData) return false;
	if (
		connection?.effectiveType === "slow-2g" ||
		connection?.effectiveType === "2g"
	) {
		return false;
	}

	const warmedAt = await readMeta<number>(WARM_META_KEY);
	if (warmedAt && nowMs - warmedAt < WARM_INTERVAL_MS) return false;

	return true;
}

function mediaUrlsFor(words: IWord[]): string[] {
	const urls = new Set<string>();
	for (const word of words) {
		for (const url of [
			word.audioUrl,
			word.ukAudioUrl,
			word.usAudioUrl,
			word.imageUrl,
			word.imageThumbnailUrl,
		]) {
			if (url) urls.add(url);
		}
	}
	return [...urls].slice(0, WARM_MAX_MEDIA_URLS);
}

async function hasStorageHeadroom(): Promise<boolean> {
	if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
		return true;
	}
	try {
		const { usage, quota } = await navigator.storage.estimate();
		if (!usage || !quota) return true;
		return usage / quota < STORAGE_PRESSURE_RATIO;
	} catch {
		return true;
	}
}

/**
 * Prime the cache for the course the learner was last using.
 *
 * The prefetches deliberately use the *exact* query keys the pages will read —
 * the practice page keys on its own session's word ids, which is a different key
 * from the course page's whole-course list, so warming only the superset would
 * leave the practice page with a cache miss.
 */
export async function warmOfflineCache(
	queryClient: QueryClient,
): Promise<OfflinePool | null> {
	if (isWarming) return null;
	isWarming = true;

	try {
		const lastCourse = getLastLearnCourse();
		if (!lastCourse?.id) return null;

		const courseId = lastCourse.id;

		const course = await queryClient.fetchQuery({
			queryKey: queryKeys.courses.detail(courseId),
			queryFn: () => getCourseDetailById(courseId),
			gcTime: SESSION_CRITICAL_GC_TIME,
		});

		const allWordIds = (course.lessons ?? []).flatMap((lesson) =>
			(lesson.words ?? []).map((word) => word.id),
		);
		if (allWordIds.length === 0) return null;

		// The whole-course superset, so the course page renders offline.
		await queryClient.fetchQuery({
			queryKey: queryKeys.wordProgress.byWordIds(allWordIds),
			queryFn: () => getProgressByWordIds(allWordIds),
			gcTime: SESSION_CRITICAL_GC_TIME,
		});

		const dueLimit = readDueWordsLimitFromStorage();
		const newLimit = readNewWordsLimitFromStorage();

		// Both variants the course page's two CTAs issue.
		const sessions = await Promise.all(
			[
				{ includeNew: false, newLimit: undefined },
				{ includeNew: true, newLimit },
			].map(async (variant) => {
				const result = await queryClient.fetchQuery({
					queryKey: queryKeys.dueWordIds.byWordIds(
						allWordIds,
						dueLimit,
						variant.includeNew,
						variant.newLimit,
					),
					queryFn: () =>
						getDueWordIdsByWordIds(
							allWordIds,
							dueLimit,
							variant.includeNew,
							variant.newLimit,
						),
					gcTime: SESSION_CRITICAL_GC_TIME,
				});
				return result.wordIds;
			}),
		);

		const sessionWordIds = [...new Set(sessions.flat())].slice(
			0,
			WARM_MAX_WORDS,
		);
		if (sessionWordIds.length === 0) return null;

		// The exact subset keys the practice page reads.
		const words = await queryClient.fetchQuery({
			queryKey: queryKeys.words.byIds(courseId, sessionWordIds),
			queryFn: () => getWordsByIds(courseId, sessionWordIds),
			gcTime: SESSION_CRITICAL_GC_TIME,
		});
		await queryClient.fetchQuery({
			queryKey: queryKeys.wordProgress.byWordIds(sessionWordIds),
			queryFn: () => getProgressByWordIds(sessionWordIds),
			gcTime: SESSION_CRITICAL_GC_TIME,
		});

		const pool: OfflinePool = {
			courseId,
			courseName: course.name,
			wordIds: sessionWordIds,
			warmedAt: new Date().toISOString(),
		};
		queryClient.setQueryData(
			queryKeys.offlinePool.forCourse(courseId),
			pool,
		);

		if (await hasStorageHeadroom()) {
			requestMediaCaching(mediaUrlsFor(words));
		}

		await writeMeta(WARM_META_KEY, Date.now());
		return pool;
	} catch {
		// Warming is best-effort by definition — a failure here must never
		// surface to the learner or block anything.
		return null;
	} finally {
		isWarming = false;
	}
}
