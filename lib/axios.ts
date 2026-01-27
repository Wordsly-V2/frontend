import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');

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
        const res = await axiosInstance.get('/auth/refresh-token', {
          baseURL: axiosInstance.defaults.baseURL,
          withCredentials: true,
        });
        const newToken = res.data.token;

        localStorage.setItem('access_token', newToken);

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
        localStorage.removeItem('access_token');
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

export default axiosInstance;
