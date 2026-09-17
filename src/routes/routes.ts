import type { Express } from "express";
import type { Pool }    from "pg";

export default class Routes {
    static register(app: Express, context: { db: Pool }): void {
        const { db } = context;

        // routes go here
    }
}
