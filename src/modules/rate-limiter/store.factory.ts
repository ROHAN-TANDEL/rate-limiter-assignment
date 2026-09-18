import type { Pool } from "pg";
import type { StorageStrategy } from "./clients.js";
import type { IStore } from "./stores/store.interface.js";
import { MemoryStore } from "./stores/memory.store.js";
import { PostgresStore } from "./stores/postgres.store.js";

// TODO(platform): Module-level mutable singletons have two problems:
// 1. The `pool` argument passed to resolveStore() on the second+ call is silently
//    ignored — whichever pool was used on the first call is locked in forever. This
//    is misleading and will cause subtle bugs if different pools are passed (e.g. in tests).
// 2. There is no way to reset/swap stores without restarting the process, which makes
//    test isolation impossible without module-level mocking.
// Fix: replace with a factory function that accepts an explicit context object
// (e.g. { pool, redis }) and returns a bound resolveStore. Singletons should be
// owned by app.ts and passed in, not created lazily on first use.
let memoryInstance: MemoryStore | null = null;
let postgresInstance: PostgresStore | null = null;

export function resolveStore(strategy: StorageStrategy, pool: Pool): IStore {
    if (strategy === "postgres") {
        if (!postgresInstance) {
            postgresInstance = new PostgresStore(pool);
        }
        return postgresInstance;
    }

    if (!memoryInstance) {
        memoryInstance = new MemoryStore();
    }
    return memoryInstance;
}