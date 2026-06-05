import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";
import type { IBulkRecordAnswersDto } from "@/types/word-progress/word-progress.type";

const PENDING_SAVES_KEY = "practice-pending-saves";

export interface PendingPracticeSave {
    id: string;
    savedAt: string;
    payload: IBulkRecordAnswersDto;
}

function readQueue(): PendingPracticeSave[] {
    const raw = getLocalStorageItem(PENDING_SAVES_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as PendingPracticeSave[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeQueue(queue: PendingPracticeSave[]): void {
    setLocalStorageItem(PENDING_SAVES_KEY, JSON.stringify(queue));
}

export function getPendingPracticeSaves(): PendingPracticeSave[] {
    return readQueue();
}

export function enqueuePendingPracticeSave(payload: IBulkRecordAnswersDto): void {
    const queue = readQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        savedAt: new Date().toISOString(),
        payload,
    });
    writeQueue(queue);
}

export function removePendingPracticeSave(id: string): void {
    writeQueue(readQueue().filter((item) => item.id !== id));
}
