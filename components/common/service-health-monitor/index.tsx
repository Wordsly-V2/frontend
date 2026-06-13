"use client";

import { getServiceHealth, healthCheck, ServiceHealth } from '@/apis/app.api';
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

    healthCheck()
        .then(notifyUnhealthyServices)
        .catch(() => undefined);
}

export default function ServiceHealthMonitor() {
    useEffect(() => {
        const initialTimeout = setTimeout(runHealthChecks, 100);
        const interval = setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, []);

    return null;
}
