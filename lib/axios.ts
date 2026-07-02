import axios, { AxiosError, AxiosResponse } from 'axios';
import {
	ACCESS_TOKEN_STORAGE_KEY,
	REFRESH_TOKEN_STORAGE_KEY,
	getLocalStorageItem,
	setLocalStorageItem,
} from '@/lib/local-storage';

const axiosInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	withCredentials: true,
});

axiosInstance.interceptors.request.use(
	(config) => {
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
	(response) => response,
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

		return Promise.reject(
			error instanceof Error ? error : new Error(String(error)),
		);
	},
);

/**
 * Runs an axios call and unwraps `response.data`, normalizing thrown errors to
 * the server's error payload (`error.response.data`) when present. Lets every
 * API function drop its own identical try/catch boilerplate.
 */
export async function request<T>(
	fn: (instance: typeof axiosInstance) => Promise<AxiosResponse<T>>,
): Promise<T> {
	try {
		return (await fn(axiosInstance)).data;
	} catch (error) {
		throw (error as AxiosError).response?.data || error;
	}
}

export default axiosInstance;
