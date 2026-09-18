import type { IStore, StoreUpdateResult } from "./store.interface.js";

interface CacheRecord<T> {
    data: T;
    expiresAt: number;
}

export class MemoryStore implements IStore {
    private readonly cache = new Map<string, CacheRecord<unknown>>();

    constructor() {
        // Run sweep every 30 seconds to clean expired keys and prevent OOM
        setInterval(() => this.purgeExpired(), 30_000).unref();
    }

    // TODO(platform): atomicUpdate is async but has no per-key serialisation. Two concurrent
    // requests for the same key can both read stale state before either write completes —
    // a real race condition under load even in single-threaded Node.js, because `await` yields
    // the event loop between the read and the write. Fix: chain updates for the same key onto
    // a per-key promise queue so each update awaits the previous one before reading.
    async atomicUpdate<T>(
        key: string,
        ttlMs: number,
        mutator: (current: T | null) => StoreUpdateResult<T>
    ): Promise<StoreUpdateResult<T>> {
        const now = Date.now();
        const record = this.cache.get(key) as CacheRecord<T> | undefined;
        const currentData = record && record.expiresAt > now ? record.data : null;

        const result = mutator(currentData);

        this.cache.set(key, {
            data: result.data,
            expiresAt: now + ttlMs,
        });

        return result;
    }

    private purgeExpired(): void {
        const now = Date.now();
        for (const [key, record] of this.cache.entries()) {
            if (record.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }

    async close(): Promise<void> {
        this.cache.clear();
    }
}