const server = {
    http_request_timeout_ms:    parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS    ?? "30000", 10),
    http_headers_timeout_ms:    parseInt(process.env.HTTP_HEADERS_TIMEOUT_MS    ?? "31000", 10),
    http_keep_alive_timeout_ms: parseInt(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS ?? "32000", 10),
};

export default server;
