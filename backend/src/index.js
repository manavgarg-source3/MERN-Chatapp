import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.route.js";
import friendRoutes from "./routes/friend.route.js";
import messageRoute from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import { isOriginAllowed } from "./lib/runtime.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveFrontendDistPath = () => {
  const candidatePaths = [
    process.env.FRONTEND_DIST_PATH,
    path.resolve(process.cwd(), "frontend/vite-project/dist"),
    path.resolve(__dirname, "../../frontend/vite-project/dist"),
  ].filter(Boolean);

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const frontendDistPath = resolveFrontendDistPath();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(isOriginAllowed(origin) ? null : new Error("HTTP origin not allowed"), true);
    },
    credentials: true,
    methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json({ limit: "25mb" })); 
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoute);

if (process.env.NODE_ENV === "production") {
  if (!frontendDistPath) {
    console.error(
      "Frontend build not found. Set FRONTEND_DIST_PATH or build the frontend before starting the server."
    );
  } else {
    console.log(`Serving frontend from ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  }
}


server.listen(PORT, () => {
  console.log("Server is running on Port:" + PORT);
  connectDB();
});
