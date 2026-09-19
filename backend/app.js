import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";

const app = express();

// CORS
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/workspace", workspaceRouter);

export default app;