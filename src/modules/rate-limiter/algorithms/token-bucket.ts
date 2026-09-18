import type { IAlgorithm, AlgorithmResult } from "./algorithm.interface.js";
import type { IStore } from "../stores/store.interface.js";

interface TokenBucketData {
    tokens: number;
    lastRefill: number;
}

export class TokenBucket implements IAlgorithm {
    async evaluate(key: string, limit: number, windowMs: number, store: IStore): Promise<AlgorithmResult> {
        const refillRatePerMs = limit / windowMs;

        const res = await store.atomicUpdate<TokenBucketData>(key, windowMs, (current) => {
            const now = Date.now();
            let tokens = limit;
            let lastRefill = now;

            if (current) {
                const elapsed = Math.max(0, now - current.lastRefill);
                tokens = Math.min(limit, current.tokens + elapsed * refillRatePerMs);
                lastRefill = now;
            }

            if (tokens < 1) {
                // Rejected: calculate exact ms needed to reach 1 full token
                const timeToNextToken = Math.ceil((1 - tokens) / refillRatePerMs);
                return {
                    data: { tokens, lastRefill },
                    allowed: false,
                    remaining: 0,
                    resetAt: now + timeToNextToken,
                };
            }

            // Allowed: consume 1 token
            tokens -= 1;
            const timeToRefill = tokens < limit ? Math.ceil((limit - tokens) / refillRatePerMs) : 0;

            return {
                data: { tokens, lastRefill },
                allowed: true,
                remaining: Math.floor(tokens),
                resetAt: now + timeToRefill,
            };
        });

        return { allowed: res.allowed, remaining: res.remaining, resetAt: res.resetAt };
    }
}