import { MemoryStore }   from "./stores/memory.store.js";
import { PostgresStore } from "./stores/postgres.store.js";

// singleton on app restart to have changes impact
const memoryStore = new MemoryStore();

export function resolveStore(strategy: any, pool: any): any {
    if (strategy === "postgres") return new PostgresStore(pool);
    return memoryStore;
}
