import { app, platform } from "./app.js";

const httpServer = platform.start.connect(app);
platform.stop.connect(httpServer);
