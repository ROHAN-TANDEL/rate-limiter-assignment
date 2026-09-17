import type { IAlgorithm, AlgorithmResult } from "./algorithm.interface.js";
import type { IStore } from "../stores/store.interface.js";

interface TokenBucketState {
    tokens: number;
    lastRefill: number;
}

export class TokenBucket implements IAlgorithm {
    async evaluate(key: string, limit: number, windowMs: number, store: IStore): Promise<AlgorithmResult> {
        const refillRatePerMs = limit / windowMs;

        const res = await store.atomicUpdate<TokenBucketState>(key, windowMs, (current) => {
            const now = Date.now();
            let tokens = limit;
            let lastRefill = now;

            if (current) {
                const elapsed = Math.max(0, now - current.lastRefill);
                tokens = Math.min(limit, current.tokens + elapsed * refillRatePerMs);
                lastRefill = now;
            }

            const allowed = tokens >= 1;
            if (allowed) {
                tokens -= 1;
            }

            const missing = 1 - tokens;
            const timeToNext = missing > 0 ? Math.ceil(missing / refillRatePerMs) : 0;

            return {
                data: { tokens, lastRefill },
                allowed,
                remaining: Math.floor(tokens),
                resetAt: now + timeToNext,
            };
        });

        return { allowed: res.allowed, remaining: res.remaining, resetAt: res.resetAt };
    }
}