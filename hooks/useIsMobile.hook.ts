"use client";

import { useEffect, useState } from "react";

/** True when viewport is below the `sm` breakpoint (640px). */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = globalThis.matchMedia("(max-width: 639px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    return isMobile;
}
