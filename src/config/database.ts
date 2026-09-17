const db = {
    host:     process.env.DB_HOST     ?? "localhost",
    port:     parseInt(process.env.DB_PORT ?? "5432", 10),
    database: process.env.DB_NAME     ?? "rate_limiter",
    schema:   process.env.DB_SCHEMA   ?? "public",
    user:     process.env.DB_USER     ?? "root",
    password: process.env.DB_PASSWORD ?? "root123",
};

export default db;