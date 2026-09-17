import "dotenv/config";
import express  from "express";
import { Builder } from "./platform/builder.js";
import Routes      from "./routes/routes.js";

const appServer = express();
const build     = new Builder(appServer);

const db      = build.buildDB();
const app     = build.buildMiddlewares(appServer);
const context = { db };

Routes.register(app, context);

const platform = build.buildServer();

// Register DB pool teardown on graceful shutdown
platform.stop.register("PostgresPool", () => db.end());

app.disable('x-powered-by');

export { app, platform };
