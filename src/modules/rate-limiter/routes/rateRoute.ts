import { Router } from "express";
import type { Pool } from "pg";
import { authenticate } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../middlewares/rate-limiter.middleware.js";

export default class RateRoutes {
    routes(db: Pool): Router {
        const router = Router();

        router.get(
            "/foo",
            authenticate,
            rateLimiter("foo", db),
            // completed - (api-contract): "succes" is a typo — should be "success". Fix the response
            // body here and update the corresponding test assertion in rate-limiter.test.ts.
            (_req, res) => res.status(200).json({ success: true })
        );

        router.get(
            "/bar",
            authenticate,
            rateLimiter("bar", db),
            // completed - (api-contract): same typo — "succes" should be "success".
            (_req, res) => res.status(200).json({ success: true })
        );

        return router;
    }
}