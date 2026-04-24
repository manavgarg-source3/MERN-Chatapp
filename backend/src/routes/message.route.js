import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  adminDeleteGroupMessage,
  addGroupMembers,
  createGroup,
  deleteDirectMessageForEveryone,
  deleteDirectMessageForMe,
  deleteGroupMessageForEveryone,
  getDirectMessages,
  getGroupDetails,
  getGroupMessages,
  getGroups,
  getUsersForSidebar,
  markGroupMessagesAsReadController,
  markMessagesAsRead,
  removeGroupMember,
  sendDirectMessage,
  sendGroupMessage,
  updateGroup,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/groups", protectRoute, getGroups);
router.post("/groups", protectRoute, createGroup);
router.get("/groups/:id", protectRoute, getGroupDetails);
router.patch("/groups/:id", protectRoute, updateGroup);
router.post("/groups/:id/members", protectRoute, addGroupMembers);
router.delete("/groups/:id/members/:memberId", protectRoute, removeGroupMember);
router.get("/direct/:id", protectRoute, getDirectMessages);
router.get("/group/:id", protectRoute, getGroupMessages);
router.patch("/read/:id", protectRoute, markMessagesAsRead);
router.patch("/group/read/:id", protectRoute, markGroupMessagesAsReadController);
router.patch("/direct/delete/me/:id", protectRoute, deleteDirectMessageForMe);
router.patch("/direct/delete/everyone/:id", protectRoute, deleteDirectMessageForEveryone);
router.patch("/group/delete/everyone/:id", protectRoute, deleteGroupMessageForEveryone);
router.patch("/group/delete/admin/:id", protectRoute, adminDeleteGroupMessage);
router.post("/send/direct/:id", protectRoute, sendDirectMessage);
router.post("/send/group/:id", protectRoute, sendGroupMessage);

export default router;
