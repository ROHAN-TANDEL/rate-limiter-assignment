export type Algorithm = "token-bucket" | "sliding-window";
export type StorageStrategy = "memory" | "postgres";

export interface EndpointPolicy {
    enabled: boolean;
    algorithm: Algorithm;
    limit: number;
    windowMs: number;
    storage: StorageStrategy;
}

export interface ClientConfig {
    enabled: boolean;
    foo: EndpointPolicy;
    bar: EndpointPolicy;
}

// TODO(platform): Client registry is hardcoded in source — onboarding/offboarding a client
// or changing a limit requires a code change and full redeploy. Externalise this to a JSON
// config file (e.g. clients.config.json) loaded at startup via an env-var path, validated
// with Zod, so changes only need a config update + restart. Consider a hot-reload mechanism
// (DB-backed config with polling, or a pub/sub invalidation signal) for zero-downtime updates.
export const clientRegistry: Record<string, ClientConfig> = {
    "client-1": {
        enabled: true,
        foo: { enabled: true, algorithm: "token-bucket", limit: 5, windowMs: 1_000, storage: "memory" },
        bar: { enabled: true, algorithm: "sliding-window", limit: 5, windowMs: 1_000, storage: "postgres" },
    },
    "client-2": {
        enabled: true,
        foo: { enabled: true, algorithm: "token-bucket", limit: 2, windowMs: 1_000, storage: "postgres" },
        bar: { enabled: true, algorithm: "sliding-window", limit: 4, windowMs: 1_000, storage: "memory" },
    },
};