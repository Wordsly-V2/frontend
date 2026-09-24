import axios, { AxiosError, AxiosResponse } from 'axios';
import {
	ACCESS_TOKEN_STORAGE_KEY,
	REFRESH_TOKEN_STORAGE_KEY,
	getLocalStorageItem,
	setLocalStorageItem,
} from '@/lib/local-storage';
import { toApiError } from '@/lib/api-error';
import { apiPaths } from '@/lib/api-paths';
import { isLogoutPending } from '@/lib/logout-pending';
import {
	reportNetworkFailure,
	reportNetworkSuccess,
} from '@/lib/offline/online-status';
import { isColdStartError } from '@/lib/cold-start';
import {
	markPossiblyCold,
	noteServiceActivity,
	whenWarm,
} from '@/lib/service-warmup';

const axiosInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	withCredentials: true,
});

axiosInstance.interceptors.request.use(
	async (config) => {
		// Hold this request behind a wake that is already running.
		//
		// This is the fix for "the page came up empty the first time": on a
		// suspended free-tier instance the bootstrap's wake used to race the
		// page's own queries, and the queries lost — twenty requests failed
		// against a server that was, seconds later, perfectly healthy. Now they
		// queue behind the same wake instead. Never *starts* a wake (see
		// whenWarm) and returns immediately when none is in flight, so a warm
		// app pays nothing for this.
		await whenWarm();

		if (typeof window !== 'undefined') {
			const token = getLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY);

			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}

		config.headers['Content-Type'] = 'application/json';
		return config;
	},
	(error) => Promise.reject(error),
);

/** Name of the Web Lock that serializes refreshes across every open tab. */
const REFRESH_LOCK = 'wordsly-auth-refresh';

/** The bearer token a request actually went out with, if any. */
const sentAccessToken = (config: { headers?: Record<string, unknown> }) => {
	const header = config.headers?.Authorization ?? config.headers?.authorization;
	return typeof header === 'string' && header.startsWith('Bearer ')
		? header.slice('Bearer '.length)
		: null;
};

/**
 * Exchange the refresh token for a new access token — at most once, however
 * many tabs and requests hit a 401 together.
 *
 * Refresh tokens are single-use: the server rotates on every exchange and a
 * token presented again after its grace window reads as theft and ends every
 * session. So the exchange runs under a cross-tab lock, and once inside it the
 * caller first checks whether someone already refreshed since its request went
 * out — another tab, or an earlier 401 in this one — and simply reuses that
 * token instead of spending the refresh token a second time.
 */
const refreshAccessToken = async (staleToken: string | null): Promise<string> => {
	const run = async (): Promise<string> => {
		const current = getLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY);
		if (current && current !== staleToken) {
			return current;
		}

		// In 'body' delivery mode the refresh token lives in localStorage and must be
		// sent via header; in cookie mode it is empty and the http cookie is used instead.
		const storedRefreshToken = getLocalStorageItem(REFRESH_TOKEN_STORAGE_KEY);
		const res = await axios.get(apiPaths.auth.refreshToken(), {
			baseURL: axiosInstance.defaults.baseURL,
			withCredentials: true,
			headers: storedRefreshToken
				? { 'x-refresh-token': storedRefreshToken }
				: undefined,
		});
		const newToken: string = res.data.accessToken;

		setLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY, newToken);
		// Backend rotates the refresh token and returns it only in 'body' mode.
		if (res.data.refreshToken) {
			setLocalStorageItem(REFRESH_TOKEN_STORAGE_KEY, res.data.refreshToken);
		}
		return newToken;
	};

	if (typeof navigator === 'undefined' || !navigator.locks) {
		return run();
	}
	return await navigator.locks.request(REFRESH_LOCK, run);
};

/** This tab's in-flight refresh, shared by every request that 401s meanwhile. */
let inFlightRefresh: Promise<string> | null = null;

const refreshOnce = (staleToken: string | null): Promise<string> => {
	inFlightRefresh ??= refreshAccessToken(staleToken).finally(() => {
		inFlightRefresh = null;
	});
	return inFlightRefresh;
};

axiosInstance.interceptors.response.use(
	(response) => {
		reportNetworkSuccess();
		// Also the idle clock the cold-start check measures from: a request that
		// just succeeded is the best possible proof the instances are awake.
		noteServiceActivity();
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
			// A sign-out the server never confirmed leaves the refresh cookie
			// alive; refreshing with it now would silently sign the previous
			// user back in. Let the 401 stand — it reads as "signed out" — with
			// one exception: the logout retry itself, which needs a live token
			// to authenticate the very call that ends the session.
			if (
				isLogoutPending() &&
				originalRequest.url !== apiPaths.auth.logout()
			) {
				return Promise.reject(
					error instanceof Error ? error : new Error(String(error)),
				);
			}

			originalRequest._retry = true;

			try {
				const newToken = await refreshOnce(sentAccessToken(originalRequest));
				// Through the instance, not bare axios, so the retry gets the same
				// offline and cold-start handling as the first attempt. The request
				// interceptor re-reads the token; `_retry` stops a second refresh.
				originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				return Promise.reject(
					refreshError instanceof Error
						? refreshError
						: new Error(String(refreshError)),
				);
			}
		}

		// A failure with no response never reached the gateway — the earliest and
		// truest offline signal we get, since it comes from the real API path.
		if (!(error as AxiosError).response) {
			reportNetworkFailure();
		} else if (isColdStartError(error)) {
			// The opposite case, and one that used to be mistaken for the above:
			// we reached the platform and it answered 502/503/504 because the
			// instance is still booting. Not an outage and not this learner's
			// connection — start a wake so the retry has something to wait for.
			markPossiblyCold();
		}

		return Promise.reject(
			error instanceof Error ? error : new Error(String(error)),
		);
	},
);

/**
 * Runs an axios call and unwraps `response.data`, normalizing thrown errors to
 * the server's error payload (`error.response.data`) when present. Lets every
 * API function drop its own identical try/catch boilerplate.
 *
 * Pass `{ notFoundAsNull: true }` for endpoints where a 404 is an expected
 * "no result" (e.g. optional dictionary lookups) rather than an error — the
 * call resolves to `null` instead of throwing.
 *
 * Throws an {@link ApiError}, which carries the server payload's own fields (so
 * existing callers are unaffected) plus the status code and an `isNetworkError`
 * flag. Offline handling needs to tell "no connection" apart from "rejected".
 */
export async function request<T>(
	fn: (instance: typeof axiosInstance) => Promise<AxiosResponse<T>>,
	options?: { notFoundAsNull?: boolean },
): Promise<T> {
	try {
		return (await fn(axiosInstance)).data;
	} catch (error) {
		if (options?.notFoundAsNull && (error as AxiosError).response?.status === 404) {
			return null as T;
		}
		throw toApiError(error);
	}
}

export default axiosInstance;
