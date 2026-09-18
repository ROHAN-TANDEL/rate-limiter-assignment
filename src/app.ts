import "dotenv/config";
import express from "express";
import { Builder } from "./platform/builder.js";
import Routes from "./routes/routes.js";
import { resolveStore } from "./modules/rate-limiter/store.factory.js";
import type { PostgresStore } from "./modules/rate-limiter/stores/postgres.store.js";

const appServer = express();
const build = new Builder(appServer);

const db = build.buildDB();
const app = build.buildMiddlewares(appServer);
const context = { db };

// TODO(platform): initSchema() is called fire-and-forget — if the DB is unreachable or
// the migration fails, the app starts anyway and the first Postgres write will throw.
// This should be awaited and block startup. Extract app bootstrap into an async init()
// function and call it from server.ts: init().then(startHttpServer).catch(process.exit).
const pgStore = resolveStore("postgres", db) as PostgresStore;
pgStore.initSchema();

Routes.register(app, context);

const platform = build.buildServer();
platform.stop.register("PostgresPool", () => db.end());

app.disable("x-powered-by");

export { app, platform, db };