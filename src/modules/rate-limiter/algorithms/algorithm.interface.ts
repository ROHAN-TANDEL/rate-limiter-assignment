import type { IStore } from "../stores/store.interface.js";

export interface AlgorithmResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

export interface IAlgorithm {
    evaluate(key: string, limit: number, windowMs: number, store: IStore): Promise<AlgorithmResult>;
}