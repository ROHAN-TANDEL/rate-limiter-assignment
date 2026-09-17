import config from "../config/server.js";
import env from "../config/env.js";

export class StartServer {
    connect(app: any) {
        const port = env.app_port;
        return app.listen(port, () => {
            console.info({ server_start_status: `Server started on port ${port}` });
        });
    }
}

export class StopServer {
    private tasks: Array<{ name: string; cleanup: () => Promise<void> }> = [];
    private isShuttingDown = false;

    register(name: string, cleanup: () => Promise<void>): this {
        this.tasks.push({ name, cleanup });
        return this;
    }

    connect(httpServer?: any) {
        console.info({ server_stop_status: "Registering graceful shutdown..." });

        if (httpServer) {
            httpServer.requestTimeout    = config.http_request_timeout_ms;
            httpServer.headersTimeout    = config.http_headers_timeout_ms;
            httpServer.keepAliveTimeout  = config.http_keep_alive_timeout_ms;
        }

        const handleSignal = (signal: string) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            console.info({ signal, shutdown: "Graceful shutdown started" });
            this.shutdown(httpServer);
        };

        process.on("SIGINT",  () => handleSignal("SIGINT"));
        process.on("SIGTERM", () => handleSignal("SIGTERM"));
        process.once("unhandledRejection", (err) => { console.error({ err }); this.shutdown(httpServer); });
        process.once("uncaughtException",  (err) => { console.error({ err }); this.shutdown(httpServer); });
    }

    private shutdown(server?: any) {
        const forceExit = setTimeout(() => { console.error("Shutdown timed out. Forcing exit."); process.exit(1); }, 10_000);
        forceExit.unref();

        const finish = async () => {
            for (const task of this.tasks) {
                try   { await task.cleanup(); console.info({ cleaned: task.name }); }
                catch (e) { console.error({ cleanup_error: task.name, e }); }
            }
            clearTimeout(forceExit);
            process.exit(0);
        };

        if (server?.close) {
            server.close(() => finish());
        } else {
            finish();
        }
    }
}
