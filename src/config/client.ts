const clients = {
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

export default clients;