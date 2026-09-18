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
                // TODO(platform): Add a Retry-After header (RFC 7231 §7.1.3) so clients
                // doing standards-compliant backoff know exactly when to retry:
                //   const retryAfterSecs = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
                //   res.setHeader("Retry-After", retryAfterSecs);
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
        } catch (err:any) {
            // Log the DB degradation
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorCode = err?.code ?? "UNKNOWN_DB_ERROR";

            console.error({
                rate_limiter_fault: "Storage failure during rate limit check",
                storage: policy.storage,
                code: errorCode,
                error: errorMessage || "Database connection dropped/unavailable",
            });

            // FAIL-OPEN STRATEGY:
            // Allow the request to proceed so users aren't broken by a rate-limiter hiccup
            res.setHeader("X-RateLimit-Status", "bypassed-storage-error");
            // global middleware to catch errors is needed next(err)
            next();

            // FAIL-CLOSED STRATEGY ALTERNATIVE:
            // res.status(503).json({ error: "Rate limiting service temporarily unavailable" });
        }
    };
}