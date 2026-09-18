import type { Request, Response, NextFunction } from "express";
import { clientRegistry } from "../clients.js";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers["authorization"] ?? "";

    if (!header.toLowerCase().startsWith("bearer ")) {
        res.status(401).json({ error: "Missing Authorization header" });
        return;
    }

    const clientId = header.slice(7).trim();

    // TODO(security): clientId is used raw as a store key and registry lookup with no
    // validation. Strings like "../../etc/passwd" or a 10 KB payload pass straight through.
    // Add a regex guard before the registry lookup, e.g.:
    //   const CLIENT_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
    //   if (!CLIENT_ID_REGEX.test(clientId)) return res.status(401).json({ error: "Invalid client ID format" });

    const client = clientRegistry[clientId];

    if (!client) {
        res.status(401).json({ error: `Unknown client: ${clientId}` });
        return;
    }

    if (!client.enabled) {
        res.status(403).json({ error: `Client disabled: ${clientId}` });
        return;
    }

    res.locals["clientId"] = clientId;
    res.locals["client"] = client;
    next();
}