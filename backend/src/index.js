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

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔍 Resolve frontend build path (for Render)
const resolveFrontendDistPath = () => {
  const candidatePaths = [
    process.env.FRONTEND_DIST_PATH,
    path.resolve(process.cwd(), "frontend/vite-project/dist"),
    path.resolve(__dirname, "../../frontend/vite-project/dist"),
  ].filter(Boolean);

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const frontendDistPath = resolveFrontendDistPath();

// 🔥 Control frontend serving
const shouldServeFrontend = process.env.SERVE_FRONTEND === "true";

// ✅ Middlewares
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// ✅ CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoute);

// ✅ Serve frontend ONLY on Render
if (shouldServeFrontend) {
  if (!frontendDistPath) {
    console.error(
      "Frontend build not found. Set FRONTEND_DIST_PATH or build the frontend."
    );
  } else {
    console.log(`Serving frontend from ${frontendDistPath}`);

    app.use(express.static(frontendDistPath));

    // 🔥 IMPORTANT FIX (more reliable than path.join)
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: frontendDistPath });
    });
  }
}

// 🚀 Start server
server.listen(PORT, () => {
  console.log("Server is running on Port:" + PORT);
  connectDB();
});
