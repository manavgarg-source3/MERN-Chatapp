import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getIceServers } from "../controllers/webrtc.controller.js";

const router = express.Router();

// ICE servers (STUN + TURN) for the WebRTC client. Auth-protected so TURN
// relay credentials aren't handed out to anonymous traffic.
router.get("/ice", protectRoute, getIceServers);

export default router;
