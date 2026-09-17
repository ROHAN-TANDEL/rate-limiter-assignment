import type { Request, Response, NextFunction } from "express";
import { clientRegistry } from "../config/clients.js";

/**
 * Extracts client-id from `Authorization: Bearer <client-id>`.
 * Attaches validated ClientConfig to res.locals for downstream use.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers["authorization"] ?? "";

    if (!header.toLowerCase().startsWith("bearer ")) {
        res.status(401).json({ error: "Missing Authorization header" });
        return;
    }

    const clientId = header.slice(7).trim();
    const client   = clientRegistry[clientId];

    if (!client) {
        res.status(401).json({ error: `Unknown client: ${clientId}` });
        return;
    }

    if (!client.enabled) {
        res.status(403).json({ error: `Client disabled: ${clientId}` });
        return;
    }

    res.locals["clientId"] = clientId;
    res.locals["client"]   = client;
    next();
}
