import type { Algorithm } from "./clients.js";
import type { IAlgorithm } from "./algorithms/algorithm.interface.js";
import { TokenBucket } from "./algorithms/token-bucket.js";
import { SlidingWindow } from "./algorithms/sliding-window.js";

const algorithms: Record<Algorithm, IAlgorithm> = {
    "token-bucket": new TokenBucket(),
    "sliding-window": new SlidingWindow(),
};

export function resolveAlgorithm(name: Algorithm): IAlgorithm {
    const algo = algorithms[name];
    if (!algo) {
        throw new Error(`Unsupported algorithm: ${name}`);
    }
    return algo;
}