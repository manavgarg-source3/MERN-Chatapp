import express from "express";
import dotenv from "dotenv";
import path from 'path'
import authRoutes from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import {app,server} from './lib/socket.js'

dotenv.config();

const PORT = process.env.PORT;
const _dirname =  path.resolve()

// ✅ Apply CORS middleware BEFORE routes
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend's URL
    credentials: true, // Allow credentials (cookies, headers, etc.)
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

// ✅ Increase payload size limits to handle image uploads
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ✅ Additional CORS fix: Manually set headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Now define your routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoute);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/vite-project/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/vite-project/dist", "index.html"));
  });
}


// ✅ Start the server
server.listen(PORT, () => {
  console.log("Server is running on Port:" + PORT);
  connectDB();
});
