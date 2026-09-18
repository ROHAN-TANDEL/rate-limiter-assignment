import { Pool } from "pg";
import db from "../config/database.js";

export default class Connect {
    pool(): Pool {
        const { schema, ...creds } = db;
        const pool = new Pool({
            ...creds,
            options: schema ? `-c search_path=${schema}` : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000, // Fail fast if DB is down (2s instead of hanging)
        });

        // CRITICAL: Catches unexpected errors on idle backend connections
        // Prevents Node.js from throwing an unhandled 'error' event and crashing
        pool.on("error", (err) => {
            console.warn({
                db_pool_warning: "Unexpected error on idle PostgreSQL client",
                code: (err as any)?.code,
                message: err.message,
            });
        });

        return pool;
    }
}