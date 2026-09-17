import { EventEmitter } from "events";
import type { AppEvent } from "./events.js";

class EventPublisher extends EventEmitter {
    publish(event: AppEvent): void {
        setImmediate(() => this.emit(event.type, event));
    }
}

export const publisher = new EventPublisher();

publisher.on("RateLimitExceeded", (event: AppEvent) => {
    console.warn({ event_published: event });
});