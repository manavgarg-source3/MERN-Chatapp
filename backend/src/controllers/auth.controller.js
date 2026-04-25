import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import { sendPasswordResetEmail, sendVerificationOtpEmail } from "../lib/email.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const getClientUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.CLIENT_URL || "https://gargx.onrender.com";
  }

  return process.env.DEV_CLIENT_URL || "http://localhost:5173";
};

const generateVerificationOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const isEmailVerified = (user) => user?.isVerified !== false;

const attachVerificationOtp = (user) => {
  user.emailVerificationOtp = generateVerificationOtp();
  user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
};

const formatAuthUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
  isVerified: user.isVerified !== false,
});

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try { 
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && isEmailVerified(existingUser)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = existingUser || new User({ email });
    user.fullName = fullName;
    user.password = hashedPassword;
    user.isVerified = false;
    attachVerificationOtp(user);
    await user.save();

    await sendVerificationOtpEmail({
      email: user.email,
      fullName: user.fullName,
      otp: user.emailVerificationOtp,
    });

    res.status(201).json({
      message: "Account created. Please verify your email with the OTP sent to your inbox.",
      email: user.email,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        message: "Please verify your email first",
        requiresVerification: true,
        email: user.email,
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      ...formatAuthUser(user),
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isEmailVerified(user)) {
      return res.status(200).json({ message: "Email already verified" });
    }

    if (
      user.emailVerificationOtp !== otp ||
      !user.emailVerificationOtpExpires ||
      user.emailVerificationOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. Please log in." });
  } catch (error) {
    console.log("Error in verifyEmailOtp controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerificationOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isEmailVerified(user)) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    attachVerificationOtp(user);
    await user.save();

    await sendVerificationOtpEmail({
      email: user.email,
      fullName: user.fullName,
      otp: user.emailVerificationOtp,
    });

    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.log("Error in resendVerificationOtp controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const clientUrl = getClientUrl();
      const resetUrl = `${clientUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

      await sendPasswordResetEmail({
        email: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    }

    res.status(200).json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.log("Error in requestPasswordReset controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error in resetPassword controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName } = req.body;
    const userId = req.user._id;
    const updates = {};

    if (typeof fullName === "string") {
      const trimmedFullName = fullName.trim();

      if (!trimmedFullName) {
        return res.status(400).json({ message: "Full name is required" });
      }

      updates.fullName = trimmedFullName;
    }

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updates.profilePic = uploadResponse.secure_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select(
      "-password"
    );

    res.status(200).json(formatAuthUser(updatedUser));
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
