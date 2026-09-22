import axios, { AxiosError, AxiosResponse } from 'axios';
import {
	ACCESS_TOKEN_STORAGE_KEY,
	REFRESH_TOKEN_STORAGE_KEY,
	getLocalStorageItem,
	setLocalStorageItem,
} from '@/lib/local-storage';
import { toApiError } from '@/lib/api-error';
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

type FailedQueueItem = {
	resolve: (token: string | null) => void;
	reject: (error: Error) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
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

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			if (isRefreshing) {
				return new Promise(function (resolve, reject) {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers['Authorization'] = 'Bearer ' + token;
						return axios(originalRequest);
					})
					.catch((err) =>
						Promise.reject(err instanceof Error ? err : new Error(String(err))),
					);
			}

			isRefreshing = true;

			try {
				// In 'body' delivery mode the refresh token lives in localStorage and must be
				// sent via header; in cookie mode it is empty and the http cookie is used instead.
				const storedRefreshToken = getLocalStorageItem(
					REFRESH_TOKEN_STORAGE_KEY,
				);
				const res = await axios.get('/auth/refresh-token', {
					baseURL: axiosInstance.defaults.baseURL,
					withCredentials: true,
					headers: storedRefreshToken
						? { 'x-refresh-token': storedRefreshToken }
						: undefined,
				});
				const newToken = res.data.accessToken;

				setLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY, newToken);
				// Backend rotates the refresh token and returns it only in 'body' mode.
				if (res.data.refreshToken) {
					setLocalStorageItem(
						REFRESH_TOKEN_STORAGE_KEY,
						res.data.refreshToken,
					);
				}

				processQueue(null, newToken);

				originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
				return axios(originalRequest);
			} catch (refreshError) {

				processQueue(
					refreshError instanceof Error
						? refreshError
						: new Error(String(refreshError)),
					null,
				);

				return Promise.reject(
					refreshError instanceof Error
						? refreshError
						: new Error(String(refreshError)),
				);
			} finally {
				isRefreshing = false;
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
