import type { Express } from "express";
import type { Pool }    from "pg";
import {authenticate} from "../auth/auth.middleware";
import {rateLimiter} from "../modules/rate-limiter/rate-limiter.middleware";

export default class Routes {
    static register(app: Express, context: { db: Pool }): void {
        const { db } = context;

        // routes go here
        app.get(
            "/foo",
            authenticate,
            rateLimiter("foo", db),
            (_req, res) => res.status(200).json({ success: true }),
        );

        app.get(
            "/bar",
            authenticate,
            rateLimiter("bar", db),
            (_req, res) => res.status(200).json({ success: true }),
        );
    }
}
