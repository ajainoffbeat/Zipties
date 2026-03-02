import express, { type Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorLogs } from "./middlewares/errorLogs.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { env } from "./config/env.js";
import { authMiddleware } from "./middlewares/auth.js";
import postRoutes from "./routes/post.routes.js";

const RATE_LIMIT_REQ =
  Number.parseInt(env.RATE_LIMIT_REQ ?? "5", 10);
const RATE_LIMIT_TIME =
  Number.parseInt(env.RATE_LIMIT_TIME ?? "60", 10);
const app: Application = express();

app.use(
  cors({
    origin: ["http://zipties-frontend-bucket.s3-website-us-east-1.amazonaws.com", "http://localhost:8081", "http://localhost:5173"],
    credentials: true,
  })
);
app.set("trust proxy", true);
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));
app.use(rateLimiter(RATE_LIMIT_REQ, RATE_LIMIT_TIME));
app.use(express.static('uploads'));

app.use("/api", authRoutes);
app.use("/api/conversation", authMiddleware, conversationRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/posts", authMiddleware, postRoutes);
app.use(errorLogs);
app.use(errorMiddleware);



export default app;
