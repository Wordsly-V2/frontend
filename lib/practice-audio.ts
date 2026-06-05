let sharedAudio: HTMLAudioElement | null = null;

export function playAudioUrl(url: string | undefined): void {
    if (!url || globalThis.window === undefined) return;
    try {
        if (!sharedAudio) {
            sharedAudio = new Audio();
        }
        sharedAudio.src = url;
        void sharedAudio.play().catch(() => {
            // autoplay or missing file — ignore
        });
    } catch {
        // ignore
    }
}
