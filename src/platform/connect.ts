import { Pool } from "pg";
import db from "../config/database.js";

export default class Connect {
    pool(): Pool {
        const { schema, ...creds } = db;
        return new Pool({
            ...creds,
            options: schema ? `-c search_path=${schema}` : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
        });
    }
}