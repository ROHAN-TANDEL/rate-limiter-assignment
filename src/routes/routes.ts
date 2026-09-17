import type { Express } from "express";
import type { Pool } from "pg";
import RateRoutes from "../modules/rate-limiter/routes/rateRoute.js";

export default class Routes {
    static register(app: Express, context: { db: Pool }): void {
        const { db } = context;
        app.use(new RateRoutes().routes(db));
    }
}