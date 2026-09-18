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
                const windowsPassed = Math.floor((currentWindowStart - current.windowStart) / windowMs);

                if (windowsPassed === 0) {
                    // Still in the exact same window
                    currentCount = current.currentCount;
                    prevCount = current.prevCount;
                } else if (windowsPassed === 1) {
                    // Shifted to the next window: previous becomes current, current resets to 0
                    prevCount = current.currentCount;
                    currentCount = 0;
                } else {
                    // More than 1 window passed: everything has expired
                    prevCount = 0;
                    currentCount = 0;
                }
            }

            const elapsed = now - currentWindowStart;
            const overlapWeight = Math.max(0, (windowMs - elapsed) / windowMs);

            // Current rolling count before this new request
            const rollingCount = Math.floor(prevCount * overlapWeight) + currentCount;

            if (rollingCount >= limit) {
                // Already at or over limit: Reject immediately
                return {
                    data: { currentCount, prevCount, windowStart: currentWindowStart },
                    allowed: false,
                    remaining: 0,
                    resetAt: currentWindowStart + windowMs,
                };
            }

            // Allowed: Increment current bucket
            currentCount += 1;
            const remaining = Math.max(0, limit - (rollingCount + 1));

            return {
                data: { currentCount, prevCount, windowStart: currentWindowStart },
                allowed: true,
                remaining,
                resetAt: currentWindowStart + windowMs,
            };
        });

        return { allowed: res.allowed, remaining: res.remaining, resetAt: res.resetAt };
    }
}