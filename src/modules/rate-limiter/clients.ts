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