import express, { type Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import { errorLogs } from "./middlewares/errorLogs.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { env } from "./config/env.js";


// Rate limiter configuration (with safe defaults)
const RATE_LIMIT_REQ =
  Number.parseInt(env.RATE_LIMIT_REQ ?? "5", 10);

const RATE_LIMIT_TIME =
  Number.parseInt(env.RATE_LIMIT_TIME ?? "60", 10);

// Create Express application instance
const app: Application = express();

// CORS configuration
// - Allows requests from any origin
// - Enables cookies / credentials
// app.use(
//   cors({
//     origin: (_origin, callback) => {
//       callback(null, true); // allow all origins
//     },
//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: ["http://localhost:8080","http://localhost:8081"],
    credentials: true,
  })
);

// Trust reverse proxy (required for rate limiting, IP detection, etc.)
app.set("trust proxy", true);

// Parse incoming JSON request bodies
app.use(express.json());



// Global rate limiting middleware
// app.use(rateLimiter(RATE_LIMIT_REQ, RATE_LIMIT_TIME));

// Application routes
app.use("/api", authRoutes);
app.use("/api/conversation", conversationRoutes);
// Error logging middleware (logs errors)
app.use(errorLogs);

// Global error handler (final response to client)
app.use(errorMiddleware);



export default app;
