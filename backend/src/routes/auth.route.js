import express from "express";
import {
  checkAuth,
  login,
  logout,
  requestPasswordReset,
  resendVerificationOtp,
  resetPassword,
  signup,
  updateProfile,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/resend-email-otp", resendVerificationOtp);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
