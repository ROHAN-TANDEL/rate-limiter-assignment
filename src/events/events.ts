export interface RateLimitExceededEvent {
    type:      "RateLimitExceeded";
    clientId:  string;
    endpoint:  string;
    algorithm: string;
    storage:   string;
    timestamp: number;
}

export type AppEvent = RateLimitExceededEvent;
