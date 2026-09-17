import type { Express } from "express";
import type { Pool }    from "pg";

export default class Routes {
    static register(app: Express, context: { db: Pool }): void {
        const { db } = context;

        // routes go here
        /**
         * GET /foo — Token Bucket algorithm
         * Algorithm + storage resolved from per-client policy config.
         */
        app.get(
            "/foo",
            (_req, res) => res.status(200).json({ success: true }),
        );

        /**
         * GET /bar — Sliding Window algorithm
         * Algorithm + storage resolved from per-client policy config.
         */
        app.get(
            "/bar",
            (_req, res) => res.status(200).json({ success: true }),
        );
    }
}
