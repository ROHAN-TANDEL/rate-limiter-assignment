import { EventEmitter } from "events";
import type { AppEvent } from "./events.js";

/**
 * Thin in-process event bus.
 * Keeps the request path synchronous — events are emitted after the response is sent.
 * Swap the EventEmitter for SQS/EventBridge in a cloud deployment.
 */
class EventPublisher extends EventEmitter {
    publish(event: AppEvent): void {
        // setImmediate keeps the hot path non-blocking
        setImmediate(() => this.emit(event.type, event));
    }
}

export const publisher = new EventPublisher();

// ── Default consumer: structured log ─────────────────────────────────────────
publisher.on("RateLimitExceeded", (e: AppEvent) => {
    console.warn({ event: e });
});
