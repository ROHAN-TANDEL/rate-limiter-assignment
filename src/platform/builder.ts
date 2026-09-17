import express, { Express } from "express";
import env from "../config/env.js";
import Connect from "./connect.js";
import { StartServer, StopServer } from "./server.js";

export class Builder {
    constructor(private readonly app: Express) {}

    buildDB() {
        return new Connect().pool();
    }

    buildServer() {
        return {
            start: new StartServer(),
            stop:  new StopServer(),
        };
    }

    buildMiddlewares(app: Express): Express {
        app.use(express.json({ limit: env.request_body_limit }));
        app.use(express.urlencoded({ extended: false, limit: env.request_body_limit }));
        return app;
    }
}
