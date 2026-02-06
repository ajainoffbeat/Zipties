import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocketIO } from "./sockets/socket.handler.js";

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
    });

    app.get('/', (req, res) => {
      return res.send(`Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed", err);
    process.exit(1);
  }
};
startServer();