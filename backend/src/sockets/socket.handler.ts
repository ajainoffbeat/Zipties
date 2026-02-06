import { Server, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as socketService from "../services/socket.service.js";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../@types/conversation.types.js";

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
  socketService.initializeSocketIO(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      console.log("messges sending");
      const token = socket.handshake.auth.token;
      console.log("token",token)
      if (!token) {
        console.log("❌ Socket connection rejected: No token provided");
        return next(new Error("Authentication token required"));
      }

      if (!env.JWT_SECRET) {
        console.error("❌ JWT_SECRET not configured");
        return next(new Error("JWT_SECRET not configured"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      console.log("decoded",decoded);
      if (!decoded || !decoded.userId) {
        console.log("❌ Socket connection rejected: Invalid token payload");
        return next(new Error("Invalid token payload"));
      }

      // Attach user data to socket
      socket.data.userId = decoded.userId;
      // socket.data.username = decoded.username || "Unknown";

      console.log(`✅ Socket authenticated: (${decoded.userId})`);
      next();
    } catch (error) {
      console.error("❌ Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    console.log("userId",userId)
    console.log("username",username)
    console.log(`🔌 User connected: ${username} (${userId}) - Socket: ${socket.id}`);

    try {
      // Update user's socket ID in database
      await socketService.updateUserSocket(userId, socket.id);
      console.log(`✅ Socket ID stored in DB for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error updating user socket for ${userId}:`, error);
    }

    // Handle typing indicator
    socket.on("typing", async (payload) => {
      try {
        await socketService.emitTypingIndicator(
          payload.conversation_id,
          userId,
          username,
          payload.is_typing
        );
      } catch (error) {
        console.error("❌ Error handling typing event:", error);
      }
    });

    // Handle disconnecting (fires before disconnect)
    socket.on("disconnecting", async () => {
      console.log(`⚠️ User disconnecting: ${username} (${userId}) - Socket: ${socket.id}`);
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      console.log(`🔌 User disconnected: ${username} (${userId}) - Socket: ${socket.id} - Reason: ${reason}`);

      try {
        // Clear user's socket ID from database
        await socketService.clearUserSocket(socket.id);
        console.log(`✅ Socket ID cleared from DB for user ${userId}`);
      } catch (error) {
        console.error(`❌ Error clearing user socket for ${userId}:`, error);
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${username} (${userId}):`, error);
    });
  });

  // Handle server-level errors
  io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error:", err);
  });

  console.log("✅ Socket.IO initialized and ready for connections");
  return io;
};

