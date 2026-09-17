import type { Pool, PoolClient } from "pg";
import type { IStore, StoreUpdateResult } from "./store.interface.js";

export class PostgresStore implements IStore {
    private schemaReady = false;

    constructor(private readonly pool: Pool) {}

    public async initSchema(): Promise<void> {
        if (this.schemaReady) return;
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS rate_limit_states (
                key        TEXT PRIMARY KEY,
                data       JSONB NOT NULL,
                expires_at BIGINT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_rate_limit_states_expires_at 
            ON rate_limit_states(expires_at);
        `);
        this.schemaReady = true;
    }

    async atomicUpdate<T>(
        key: string,
        ttlMs: number,
        mutator: (current: T | null) => StoreUpdateResult<T>
    ): Promise<StoreUpdateResult<T>> {
        await this.initSchema();
        const client: PoolClient = await this.pool.connect();

        try {
            await client.query("BEGIN");
            const now = Date.now();

            // Lock the single row for this key to prevent race conditions
            const selectRes = await client.query<{ data: T; expires_at: string }>(
                `SELECT data, expires_at FROM rate_limit_states WHERE key = $1 FOR UPDATE`,
                [key]
            );

            let current: T | null = null;
            if (selectRes.rows.length > 0 && Number(selectRes.rows[0]!.expires_at) > now) {
                current = selectRes.rows[0]!.data;
            }

            const result = mutator(current);
            const expiresAt = now + ttlMs;

            await client.query(
                `INSERT INTO rate_limit_states (key, data, expires_at)
                 VALUES ($1, $2, $3)
                     ON CONFLICT (key) DO UPDATE
                                              SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
                [key, JSON.stringify(result.data), expiresAt]
            );

            // Housekeeping: delete expired rows with small probability
            if (Math.random() < 0.05) {
                await client.query(`DELETE FROM rate_limit_states WHERE expires_at <= $1`, [now]);
            }

            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}