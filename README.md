# Distributed API Rate Limiter Service

A TypeScript/Node.js service demonstrating client-specific API throttling with two rate-limiting algorithms and two interchangeable storage strategies.

The implementation is intentionally self-contained and focuses on the core requirements of the assignment while keeping the algorithm, storage, client policy, and API concerns separated.

## Architecture

The request flow is:

```text
HTTP Request
     │
     ▼
Authentication
     │
     ▼
Client Resolution
     │
     ▼
Rate Limit Policy
     │
     ▼
Rate Limiter
     │
     ├───────────────┐
     ▼               ▼
 Algorithm        Storage
     │               │
     │          ┌────┴─────┐
     │          ▼          ▼
     │       Memory    PostgreSQL
     │
     ├── Token Bucket
     │
     └── Sliding Window
```

The rate-limiting algorithm does not depend on a specific storage implementation. Likewise, the storage layer does not need to know which algorithm is using it.

This allows the same algorithm to operate with either in-memory or persistent storage.

## Implemented Requirements

### Rate Limiting

Two different algorithms are implemented:

| Endpoint | Algorithm | Purpose |
|---|---|---|
| `/foo` | Token Bucket | Allows controlled bursts while refilling continuously |
| `/bar` | Sliding Window Counter | Limits requests based on activity across the current and previous window |

Both algorithms support configurable limits and time windows.

### Storage

Two storage strategies are implemented:

| Storage | Purpose |
|---|---|
| In-Memory | Fast local state using a JavaScript `Map` |
| PostgreSQL | Persistent state suitable for multiple application instances |

The PostgreSQL implementation handles concurrent requests using database-level concurrency controls so that multiple requests cannot incorrectly initialize or update the same rate-limit state.

## Client Configuration

The currently configured clients are:

| Client | Endpoint | Algorithm | Limit | Window | Storage |
|---|---|---|---:|---:|---|
| `client-1` | `/foo` | Token Bucket | 5 | 10s | Memory |
| `client-1` | `/bar` | Sliding Window | 10 | 10s | PostgreSQL |
| `client-2` | `/foo` | Token Bucket | 2 | 10s | PostgreSQL |
| `client-2` | `/bar` | Sliding Window | 5 | 10s | Memory |

This demonstrates that both the rate limit and storage strategy can differ between clients and endpoints.

Adding another client only requires adding its policy configuration.

## Authentication

Clients are identified using the `Authorization` header:

```http
Authorization: Bearer client-1
```

The authentication middleware:

1. Extracts the bearer token.
2. Resolves the corresponding client configuration.
3. Verifies that the client is registered.
4. Verifies that the client is enabled.
5. Attaches the resolved client identity to the request.

Clients cannot modify their own rate-limit configuration through the API.

## Response Behaviour

When a request is allowed:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true
}
```

When the rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
```

```json
{
  "error": "rate limit exceeded"
}
```

Rate-limit information is also exposed through:

```text
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

## Project Structure

```text
.
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── jest.config.ts
├── scripts/
│   └── concurrent-script-runner.ts
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   └── database.ts
    ├── database/
    │   └── connect.ts
    ├── events/
    │   └── event.publisher.ts
    ├── modules/
    │   └── rate-limiter/
    │       ├── clients.ts
    │       ├── algorithm.factory.ts
    │       ├── store.factory.ts
    │       ├── algorithms/
    │       │   ├── algorithm.interface.ts
    │       │   ├── token-bucket.ts
    │       │   └── sliding-window.ts
    │       ├── stores/
    │       │   ├── store.interface.ts
    │       │   ├── memory.store.ts
    │       │   └── postgres.store.ts
    │       └── middlewares/
    │           ├── auth.middleware.ts
    │           └── rate-limiter.middleware.ts
    └── test/
        └── rate-limiter.test.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm

### Environment Setup

Create a `.env` file in the project root:

```env
APP_PORT=3000
REQUEST_BODY_LIMIT=1mb

DB_HOST=postgres
DB_PORT=5432
DB_NAME=rate_limit_states
DB_SCHEMA=public
DB_USER=root
DB_PASSWORD=root123

HTTP_REQUEST_TIMEOUT_MS=30000
HTTP_HEADERS_TIMEOUT_MS=31000
HTTP_KEEP_ALIVE_TIMEOUT_MS=32000
```

### Running with Docker Compose

The recommended way to run the complete application is:

```bash
docker compose up --build -d
```

View application logs:

```bash
docker compose logs -f api
```

The PostgreSQL database is started by Docker Compose and the required rate-limit state is initialized by the application.

To stop the environment:

```bash
docker compose down -v
```

### Running Locally

Start PostgreSQL:

```bash
docker run --name pg-limiter \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root123 \
  -e POSTGRES_DB=rate_limit_states \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Change the database host in `.env`:

```env
DB_HOST=127.0.0.1
```

Install dependencies:

```bash
npm install
```

Build the application:

```bash
npm run build
```

Start the application:

```bash
npm start
```

For development with hot reloading:

```bash
npm run dev
```

## API Verification

### 1. Token Bucket — `/foo`

`client-1` is configured for 5 requests per 1 seconds.

Send 7 rapid requests:

```bash
for i in {1..7}; do
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer client-1" \
  http://127.0.0.1:3000/foo
done
```

Expected:

```text
200
200
200
200
200
429
429
```

The first five requests are accepted and subsequent requests are rejected until tokens become available again.

### 2. Sliding Window — `/bar`

`client-1` is configured for 10 requests per 10 seconds.

Send 12 rapid requests:

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer client-1" \
  http://127.0.0.1:3000/bar
done
```

Expected:

```text
200
200
200
200
200
200
200
200
200
200
429
429
```

The first ten requests should be accepted within the configured window.

### 3. Different Client Limits

`client-2` has a lower limit for `/foo`:

```bash
for i in {1..4}; do
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer client-2" \
  http://127.0.0.1:3000/foo
done
```

Expected:

```text
200
200
429
429
```

This demonstrates that rate limits are client-specific.

## Concurrency Verification

The PostgreSQL-backed `/bar` policy can also be tested with concurrent requests.

```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer client-1" \
    http://127.0.0.1:3000/bar &
done

wait
```

With a fresh 10-request window, the expected result is:

```text
10 requests → 200
10 requests → 429
```

The purpose of this test is to demonstrate that concurrent requests cannot bypass the configured quota through race conditions.

An additional concurrency test script is available at:

```text
scripts/concurrent-script-runner.ts
```

It can be executed with:

```bash
npx tsx scripts/concurrent-script-runner.ts
```

## Automated Tests

Run the test suite with:

```bash
npm test
```

The test suite validates the core rate-limiting behaviour, including:

- endpoint routing
- client authentication
- client-specific limits
- in-memory storage
- PostgreSQL-backed state
- quota enforcement
- unauthorized access

## Event-Driven Architecture

Rate-limit decisions are synchronous because the API caller requires an immediate response.

Events are used for asynchronous side effects and integration points.

The current flow is:

```text
Request
   │
   ▼
Rate Limiter
   │
   ├── Allowed
   │
   └── Rate Limit Exceeded
             │
             ▼
          Event
             │
             ▼
       Event Publisher
```

Keeping event processing outside the critical request path prevents downstream event processing from determining whether the API request itself should receive a response.

The event layer can later be connected to infrastructure such as AWS EventBridge, SQS, Kafka, or another message broker without changing the rate-limiting algorithms.

## Failure Handling

The PostgreSQL-backed limiter treats storage failures as a separate failure mode from API processing.

When persistent rate-limit state cannot be accessed, the service can fail open and allow the request to continue rather than returning an unrelated `500` response.

The response is marked with:

```text
X-RateLimit-Status: bypassed-storage-error
```

This is a deliberate availability-over-enforcement trade-off.

In a production environment, this behaviour would be a policy decision based on the security and business requirements of the API. A security-sensitive API may instead choose to fail closed when its rate-limit store is unavailable.

### Verify Fail-Open Behaviour

Stop PostgreSQL:

```bash
docker compose stop postgres
```

Call the PostgreSQL-backed endpoint:

```bash
curl -i \
  -H "Authorization: Bearer client-1" \
  http://127.0.0.1:3000/bar
```

The request should be allowed and include:

```text
X-RateLimit-Status: bypassed-storage-error
```

Restart PostgreSQL:

```bash
docker compose start postgres
```

Normal persistent rate-limit enforcement resumes without restarting the application.

## Design Decisions

### Algorithm and Storage are Independent

The algorithm determines how requests are evaluated.

The storage implementation determines where the algorithm's state is maintained.

This separation makes it possible to introduce another storage backend, such as Redis, without rewriting the algorithms.

### Client Configuration is Server-Controlled

The client ID identifies the caller but does not control its own rate limit.

Rate-limit policies are defined by server-side configuration.

This prevents clients from modifying their own quota or disabling their limiter through request parameters.

### Persistent State is Concurrency-Safe

A simple read/update/write implementation can produce incorrect results when several requests arrive simultaneously.

The PostgreSQL store therefore uses database-level concurrency controls when updating shared rate-limit state.

This is particularly important when the application is running multiple instances against the same persistent store.

### Events are Outside the Critical Request Path

The caller needs an immediate rate-limit decision, so the decision itself remains synchronous.

Events are intended for asynchronous consumers such as:

- telemetry
- audit logging
- notifications
- analytics
- downstream integrations

## Extensibility

### Adding a New Algorithm

To add another rate-limiting algorithm:

1. Create an implementation in:

```text
src/modules/rate-limiter/algorithms/
```

2. Implement the existing algorithm contract.
3. Register the implementation in:

```text
src/modules/rate-limiter/algorithm.factory.ts
```

4. Add the algorithm to the relevant client policy.

The existing storage implementations do not need to change.

### Adding a New Storage Backend

For example, Redis can be added by:

1. Creating a new store implementation in:

```text
src/modules/rate-limiter/stores/
```

2. Implementing the existing storage contract.
3. Ensuring state updates are atomic for concurrent requests.
4. Registering the implementation in:

```text
src/modules/rate-limiter/store.factory.ts
```

5. Selecting the storage strategy through client configuration.

The rate-limiting algorithms remain unchanged.

## Scope and Future Extensions

The implementation focuses on the requirements of the assignment while keeping the design extensible.

Potential production extensions include:

- Redis-based distributed state
- dynamic client and policy administration
- distributed configuration management
- metrics and dashboards
- distributed tracing
- additional event consumers
- AWS deployment using CDK
- API Gateway integration
- more comprehensive failure and recovery policies
- IP-based throttling

These are intentionally outside the core implementation so that the assignment remains focused on rate limiting, persistence, concurrency, and event-driven integration.

## Technology Stack

- TypeScript
- Node.js
- Express
- PostgreSQL
- Docker
- Jest
- AWS-compatible event-driven architecture

##
##
##
##
##
##
## Initial Requirements Analysis

Before implementation, the requirements were broken down into four main concerns: client identity, rate-limiting policy, algorithm/storage selection, and asynchronous integration.

### Rate Limiting

The initial interpretation of the rate-limiting requirements was:

- The number of requests must be limited within a configurable time window.
- The window and request quota should be configurable.
- Different clients may have different rate limits.
- The rate limiter should be reusable across endpoints.
- The rate-limiting behaviour should be controlled by server-side configuration.
- Rate limiting should be possible to enable or disable through configuration.

### Client Identity

The `Authorization` header is used to identify the calling client:

```text
Authorization: Bearer <client-id>
```

The client identity is server-controlled and mapped to a registered client configuration.

The initial design considerations were:

- Clients should be easy to add or remove through configuration.
- Unknown clients should not be accepted.
- Disabled clients should not be allowed to make requests.
- Clients should not be able to modify their own rate-limit configuration.

For this assignment, client IDs are intentionally treated as simple registered identifiers rather than implementing a full authentication or identity-management system.

### Rate-Limiting Policy

A client is associated with a rate-limiting policy.

The policy determines:

```text
Client
  │
  ▼
Policy
  ├── enabled
  ├── algorithm
  ├── limit
  ├── window
  └── storage
```

This separates the identity of the client from the restriction applied to that client.

The client does not directly select or modify the policy. The server-side configuration determines which policy applies.

### Storage

Two storage approaches were considered based on the assignment requirements:

- In-memory storage for a lightweight/local implementation.
- PostgreSQL for persistent state and concurrency-safe shared state.

Redis was considered as another possible distributed storage option, but was not required for the initial implementation.

PostgreSQL was selected as the persistent storage implementation because it also allows the concurrency behaviour of the rate limiter to be demonstrated.

### Concurrency

A rate limiter cannot rely on a simple read-then-update operation when multiple requests can arrive concurrently.

For persistent storage, the state update therefore needs to be protected against concurrent requests so that multiple requests cannot incorrectly consume the same quota.

The implementation uses PostgreSQL-level concurrency controls for this purpose.

### Configuration Changes

Dynamic runtime changes to a client's rate-limiting policy were considered.

For example:

```text
Old policy
5 requests / 10 seconds
        │
        ▼
Configuration change
        │
        ▼
New policy
10 requests / 10 seconds
```

For the scope of this assignment, policies are server-side configuration rather than dynamically managed through an administration API.

If dynamic configuration were introduced later, new requests would resolve the current policy while already executing requests would continue using the policy they had already resolved.

### Event-Driven Integration

An additional consideration was how the rate limiter could participate in an event-driven architecture.

The actual rate-limit decision remains synchronous because the API needs to return either `200` or `429` immediately.

Events can instead be emitted for asynchronous processing, such as:

- rate-limit-exceeded notifications
- telemetry
- audit logging
- analytics
- downstream integrations

This keeps asynchronous processing outside the critical request path.

### Out of Scope

The following ideas were considered but intentionally left outside the assignment scope:

- IP-based throttling
- Exponential backoff and cooldown strategies
- Dynamic administration APIs for clients and policies
- Runtime policy management
- Redis as an additional storage implementation
- Full authentication/identity management
- Production-scale observability and dashboards
- Cloud deployment infrastructure