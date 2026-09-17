export interface RateLimitConfig {
    windowMs: number;   // time window in milliseconds
    maxRequests: number; // max allowed requests per window
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // epoch ms
}

/** Store contract — both strategies must implement this */
export interface IRateLimitStore {
    /**
     * Record a request for the given key and return the result.
     * The key is typically `"algorithm:clientId"`.
     */
    check(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
    /** Optional teardown (close connections, etc.) */
    close?(): Promise<void>;
}
