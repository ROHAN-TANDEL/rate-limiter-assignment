import type { Express } from "express";
import type { Pool } from "pg";
import RateRoutes from "../modules/rate-limiter/routes/rateRoute.js";

export default class Routes {
    static register(app: Express, context: { db: Pool }): void {
        const { db } = context;

        // TODO(platform): Add a /health endpoint that probes the DB (SELECT 1) and returns
        // 200 { status: "ok", db: "up" } or 503 { status: "degraded", db: "down" }.
        // Required for Kubernetes liveness/readiness probes and load-balancer health checks.

        app.use(new RateRoutes().routes(db));
    }
}