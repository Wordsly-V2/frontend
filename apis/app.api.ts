import axiosInstance from '@/lib/axios';
import type { AxiosError } from 'axios';
import axios from 'axios';

export type ServiceHealth = {
    name: string;
    status: 'healthy' | 'unhealthy';
    message: string;
};

const RENDER_COLD_START_TIMEOUT_MS = 90_000;

function getBootstrapServiceUrls(): string[] {
    const urls = new Set<string>();

    process.env.NEXT_PUBLIC_BOOTSTRAP_SERVICE_URLS?.split(',')
        .map((url) => url.trim())
        .filter(Boolean)
        .forEach((url) => urls.add(url));

    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (apiGatewayUrl) {
        urls.add(apiGatewayUrl);
    }

    return [...urls];
}

async function pingServiceHealth(url: string): Promise<string> {
    try {
        const response = await axios.get<string>(`${url}/ping`, {
            timeout: RENDER_COLD_START_TIMEOUT_MS,
            withCredentials: false,
        });

        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getServiceHealth = async (): Promise<string[]> => {
    const serviceApiUrls = getBootstrapServiceUrls();

    const healthChecks = await Promise.allSettled(
        serviceApiUrls.map((url) => pingServiceHealth(url)),
    );

    return healthChecks.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
    );
};

export const healthCheck = async (): Promise<ServiceHealth[]> => {
    try {
        const response = await axiosInstance.get('/ping');
        return response.data;
    } catch (error) {
        throw (error as AxiosError).response?.data || error;
    }
};
