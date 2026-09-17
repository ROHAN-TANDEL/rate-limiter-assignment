/**
 * Client registry.
 *
 * Each client has two endpoint policies: foo + bar.
 * Policy decides algorithm, limit, window, storage, and whether rate-limiting is active.
 *
 * Adding a new client = add a new entry here. No other code changes needed.
 */

export type Algorithm = "token-bucket" | "sliding-window";
export type StorageStrategy = "memory" | "postgres";

export interface EndpointPolicy {
    enabled:    boolean;
    algorithm:  Algorithm;
    limit:      number;   // max requests
    windowMs:   number;   // window duration in ms
    storage:    StorageStrategy;
}

export interface ClientConfig {
    enabled:  boolean;
    foo:      EndpointPolicy;
    bar:      EndpointPolicy;
}

export const clientRegistry: Record<string, ClientConfig> = {
    "client-1": {
        enabled: true,
        foo: { enabled: true, algorithm: "token-bucket",    limit: 5,  windowMs: 60_000, storage: "memory"   },
        bar: { enabled: true, algorithm: "sliding-window",  limit: 10, windowMs: 60_000, storage: "postgres" },
    },
    "client-2": {
        enabled: true,
        foo: { enabled: true, algorithm: "token-bucket",    limit: 2,  windowMs: 60_000, storage: "postgres" },
        bar: { enabled: true, algorithm: "sliding-window",  limit: 5,  windowMs: 60_000, storage: "memory"   },
    },
};
