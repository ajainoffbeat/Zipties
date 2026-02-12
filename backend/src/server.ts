import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocketIO } from "./sockets/socket.handler.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📡 Socket.IO ready for connections`);
    });

    app.get('/', (req, res) => {
      return res.send(`Server running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Server startup failed", { error: err });
    process.exit(1);
  }
};
startServer();