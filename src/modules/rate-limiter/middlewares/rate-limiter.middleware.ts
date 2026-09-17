import type { Request, Response, NextFunction } from "express";
import type { Pool } from "pg";
import type { ClientConfig, EndpointPolicy } from "../clients.js";
import { resolveAlgorithm } from "../algorithm.factory.js";
import { resolveStore } from "../store.factory.js";
import { publisher } from "../../../events/event.publisher.js";

export function rateLimiter(endpoint: "foo" | "bar", pool: Pool) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clientId: string = res.locals["clientId"];
        const client: ClientConfig = res.locals["client"];
        const policy: EndpointPolicy = client[endpoint];

        if (!policy.enabled) {
            next();
            return;
        }

        const algorithm = resolveAlgorithm(policy.algorithm);
        const store = resolveStore(policy.storage, pool);
        const key = `${endpoint}:${policy.algorithm}:${clientId}`;

        try {
            const result = await algorithm.evaluate(key, policy.limit, policy.windowMs, store);

            res.setHeader("X-RateLimit-Limit", policy.limit);
            res.setHeader("X-RateLimit-Remaining", result.remaining);
            res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

            if (!result.allowed) {
                publisher.publish({
                    type: "RateLimitExceeded",
                    clientId,
                    endpoint,
                    algorithm: policy.algorithm,
                    storage: policy.storage,
                    timestamp: Date.now(),
                });
                res.status(429).json({ error: "rate limit exceeded" });
                return;
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}