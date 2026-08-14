"use client";

import {
    getServiceHealth,
    healthCheck,
    pingApiGateway,
    ServiceHealth,
} from '@/apis/app.api';
import {
    reportNetworkFailure,
    reportNetworkSuccess,
    startOnlineStatusTracking,
} from '@/lib/offline/online-status';
import { useEffect } from 'react';
import { toast } from 'sonner';

const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function notifyUnhealthyServices(services: ServiceHealth[]) {
    for (const service of services) {
        if (service.status === 'unhealthy') {
            toast.warning(`${service.name} is unhealthy`, {
                description: service.message,
            });
        }
    }
}

async function runHealthChecks() {
    await getServiceHealth().catch(() => undefined);

    // Doubles as the "still online" heartbeat: publishing the result into the
    // shared connectivity store means offline detection needs no second poller.
    try {
        await pingApiGateway();
        reportNetworkSuccess();
    } catch {
        reportNetworkFailure();
    }

    healthCheck()
        .then(notifyUnhealthyServices)
        .catch(() => undefined);
}

export default function ServiceHealthMonitor() {
    useEffect(() => {
        startOnlineStatusTracking();

        const initialTimeout = setTimeout(runHealthChecks, 100);
        const interval = setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, []);

    return null;
}
