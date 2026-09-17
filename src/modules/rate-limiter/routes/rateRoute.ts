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
            (_req, res) => res.status(200).json({ succes: true })
        );

        router.get(
            "/bar",
            authenticate,
            rateLimiter("bar", db),
            (_req, res) => res.status(200).json({ succes: true })
        );

        return router;
    }
}