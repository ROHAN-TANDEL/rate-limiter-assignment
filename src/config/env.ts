import "dotenv/config";

const env = {
    app_port: parseInt(process.env.APP_PORT ?? "3000", 10),
    request_body_limit: process.env.REQUEST_BODY_LIMIT ?? "1mb",

    db: {
        host: process.env.DB_HOST ?? "localhost",
        port: parseInt(process.env.DB_PORT ?? "5432", 10),
        database: process.env.DB_NAME ?? "rate_limiter",
        schema: process.env.DB_SCHEMA ?? "public",
        user: process.env.DB_USER ?? "root",
        password: process.env.DB_PASSWORD ?? "root123",
    },

    server: {
        http_request_timeout_ms: parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS ?? "30000", 10),
        http_headers_timeout_ms: parseInt(process.env.HTTP_HEADERS_TIMEOUT_MS ?? "31000", 10),
        http_keep_alive_timeout_ms: parseInt(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS ?? "32000", 10),
    },
};

export default env;