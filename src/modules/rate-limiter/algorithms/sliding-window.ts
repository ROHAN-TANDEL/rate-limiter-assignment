import type { IAlgorithm, AlgorithmResult } from "./algorithm.interface.js";
import type { IStore } from "../stores/store.interface.js";

interface SlidingWindowState {
    currentCount: number;
    prevCount: number;
    windowStart: number;
}

export class SlidingWindow implements IAlgorithm {
    async evaluate(key: string, limit: number, windowMs: number, store: IStore): Promise<AlgorithmResult> {
        const res = await store.atomicUpdate<SlidingWindowState>(key, windowMs * 2, (current) => {
            const now = Date.now();
            const currentWindowStart = Math.floor(now / windowMs) * windowMs;

            let prevCount = 0;
            let currentCount = 0;

            if (current) {
                if (current.windowStart === currentWindowStart) {
                    currentCount = current.currentCount;
                    prevCount = current.prevCount;
                } else if (current.windowStart === currentWindowStart - windowMs) {
                    prevCount = current.currentCount;
                    currentCount = 0;
                }
            }

            const elapsed = now - currentWindowStart;
            const overlapWeight = (windowMs - elapsed) / windowMs;
            const estimatedUsage = prevCount * overlapWeight + currentCount;

            const allowed = estimatedUsage < limit;
            if (allowed) {
                currentCount += 1;
            }

            const remaining = Math.max(0, Math.floor(limit - (allowed ? estimatedUsage + 1 : estimatedUsage)));

            return {
                data: { currentCount, prevCount, windowStart: currentWindowStart },
                allowed,
                remaining,
                resetAt: currentWindowStart + windowMs,
            };
        });

        return { allowed: res.allowed, remaining: res.remaining, resetAt: res.resetAt };
    }
}