import { TokenBucket }   from "./algorithms/token-bucket.js";
import { SlidingWindow } from "./algorithms/sliding-window.js";

const algorithms = {
    "token-bucket":   new TokenBucket(),
    "sliding-window": new SlidingWindow(),
};

export function resolveAlgorithm(name: any) {
    return algorithms[name];
}
