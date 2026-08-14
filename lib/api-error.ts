import { AxiosError } from 'axios';

/**
 * Normalized API error.
 *
 * `request()` used to throw the bare server payload (`error.response.data`),
 * which discarded the status code — so nothing downstream could tell "the
 * network is gone" from "the server said 401". Offline mode depends on that
 * distinction: a network failure may fall back to cached data and the offline
 * grace period, while a 401 must wipe local data and send the user to login.
 */
export class ApiError extends Error {
	/** HTTP status, or undefined when no response was ever received. */
	readonly status?: number;
	/** The server's error payload, when there was one. */
	readonly data?: unknown;
	/** True when the request never reached the server (offline, DNS, timeout). */
	readonly isNetworkError: boolean;

	constructor(init: {
		message: string;
		status?: number;
		data?: unknown;
		isNetworkError: boolean;
	}) {
		super(init.message);
		this.name = 'ApiError';
		this.status = init.status;
		this.data = init.data;
		this.isNetworkError = init.isNetworkError;
	}
}

function messageFrom(data: unknown, fallback: string): string {
	if (data && typeof data === 'object' && 'message' in data) {
		const message = (data as { message: unknown }).message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message) && typeof message[0] === 'string') {
			return message[0];
		}
	}
	return fallback;
}

/**
 * Wrap any thrown value as an ApiError.
 *
 * The server payload's own properties are copied onto the instance so existing
 * callers that read server fields directly off the thrown value keep working.
 */
export function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) return error;

	const axiosError = error as AxiosError;
	const response = axiosError?.response;
	const data = response?.data;

	const apiError = new ApiError({
		message: messageFrom(
			data,
			axiosError?.message ?? 'Request failed',
		),
		status: response?.status,
		data,
		// No response at all means the request never completed. Axios reports a
		// cancellation the same way, so exclude it — a cancelled request is not
		// evidence that the user is offline.
		isNetworkError: !response && axiosError?.code !== 'ERR_CANCELED',
	});

	if (data && typeof data === 'object') {
		Object.assign(apiError, data);
	}

	return apiError;
}

/** True when the request never reached the server — the offline signal. */
export function isNetworkError(error: unknown): boolean {
	return toApiError(error).isNetworkError;
}

/** True when the server actively rejected the caller's identity. */
export function isUnauthorizedError(error: unknown): boolean {
	const status = toApiError(error).status;
	return status === 401 || status === 403;
}
