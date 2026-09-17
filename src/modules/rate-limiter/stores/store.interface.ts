export interface StoreUpdateResult<T> {
    data: T;
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

export interface IStore {
    atomicUpdate<T>(
        key: string,
        ttlMs: number,
        mutator: (current: T | null) => StoreUpdateResult<T>
    ): Promise<StoreUpdateResult<T>>;
    close?(): Promise<void>;
}