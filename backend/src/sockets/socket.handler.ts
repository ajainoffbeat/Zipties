import { Server, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
  initializeSocketIO as initializeSocketIOService,
  updateUserSocket,
  emitTypingIndicator,
  clearUserSocket,
} from "../services/socket.service.js";
import type {
  ServerToClientEvents,
  ClientToServerEvents, 
  InterServerEvents,
  SocketData,
} from "../@types/conversation.types.js";
import { logger } from "../utils/logger.js";

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer: HTTPServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Initialize socket service
  initializeSocketIOService(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        logger.warn("❌ Socket connection rejected: No token provided");
        return next(new Error("Authentication token required"));
      }

      if (!env.JWT_SECRET) {
        logger.error("❌ JWT_SECRET not configured");
        return next(new Error("JWT_SECRET not configured"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (!decoded || !decoded.userId) {
        logger.warn("❌ Socket connection rejected: Invalid token payload");
        return next(new Error("Invalid token payload"));
      }

      // Attach user data to socket
      socket.data.userId = decoded.userId;
      // socket.data.username = decoded.username || "Unknown";

      logger.info(`✅ Socket authenticated: ${decoded.userId}`);
      next();
    } catch (error) {
      logger.error("❌ Socket authentication error", { error });
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    try {
      // Update user's socket ID in database
      await updateUserSocket(userId, socket.id);
    } catch (error) {
      logger.error(`❌ Error updating user socket for ${userId}:`, { error });
    }

    // Handle typing indicator
    socket.on("typing", async (payload) => {
      try {
        await emitTypingIndicator(
          payload.conversation_id,
          userId,
          username,
          payload.is_typing
        );
      } catch (error) {
        logger.error("❌ Error handling typing event", { error });
      }
    });

    // Handle disconnecting (fires before disconnect)
    socket.on("disconnecting", async () => {
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {

      try {
        // Clear user's socket ID from database
        await clearUserSocket(socket.id);
      } catch (error) {
        logger.error(`❌ Error clearing user socket for ${userId}:`, { error });
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`❌ Socket error for ${username} (${userId}):`, { error });
    });
  });

  // Handle server-level errors
  io.engine.on("connection_error", (err) => {
    logger.error("❌ Socket.IO connection error", { error: err });
  });

  return io;
};
