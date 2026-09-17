import type { Pool } from "pg";
import type { StorageStrategy } from "./clients.js";
import type { IStore } from "./stores/store.interface.js";
import { MemoryStore } from "./stores/memory.store.js";
import { PostgresStore } from "./stores/postgres.store.js";

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