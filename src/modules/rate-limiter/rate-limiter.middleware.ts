import type { Request, Response, NextFunction } from "express";
import type { Pool }          from "pg";
import type { ClientConfig, EndpointPolicy } from "../../config/clients.js";

export function rateLimiter(endpoint: "foo" | "bar", pool: Pool) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clientId: string       = res.locals["clientId"];
        const client:   ClientConfig = res.locals["client"];
        const policy:   EndpointPolicy = client[endpoint];

        if (!policy.enabled) { next(); return; }

        try {
            const result = {
                remaining : policy.limit,
                resetAt : 0000,
                allowed: true
            };

            res.setHeader("X-RateLimit-Limit",     policy.limit);
            res.setHeader("X-RateLimit-Remaining", result.remaining);
            res.setHeader("X-RateLimit-Reset",     "unix-timestamp");

            if (!result.allowed) {
                res.status(429).json({ error: "rate limit exceeded" });
                return;
            }

            next();
        } catch (err) {
            console.log({message : err.message, stack : err});
            next(err);
        }
    };
}
