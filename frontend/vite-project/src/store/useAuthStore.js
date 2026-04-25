import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5001" : window.location.origin);

export const useAuthStore = create((set, get) => ({
  authUser: null,
  pendingVerificationEmail: "",
  isSigningUp: false,
  isLoggingIn: false,
  isVerifyingEmail: false,
  isResendingVerificationOtp: false,
  isRequestingPasswordReset: false,
  isResettingPassword: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  socketConnectionStatus: "disconnected",

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ pendingVerificationEmail: res.data.email });
      toast.success(res.data.message);
      return { success: true, email: res.data.email };
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create account");
      return { success: false };
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Could not log in";
      if (error.response?.data?.requiresVerification && error.response?.data?.email) {
        set({ pendingVerificationEmail: error.response.data.email });
      }
      toast.error(message);
      return {
        success: false,
        requiresVerification: Boolean(error.response?.data?.requiresVerification),
        email: error.response?.data?.email || "",
      };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  verifyEmailOtp: async ({ email, otp }) => {
    set({ isVerifyingEmail: true });
    try {
      const res = await axiosInstance.post("/auth/verify-email-otp", { email, otp });
      set({ pendingVerificationEmail: "" });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not verify email");
      return false;
    } finally {
      set({ isVerifyingEmail: false });
    }
  },

  resendVerificationOtp: async (email) => {
    set({ isResendingVerificationOtp: true });
    try {
      const res = await axiosInstance.post("/auth/resend-email-otp", { email });
      set({ pendingVerificationEmail: email });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend OTP");
      return false;
    } finally {
      set({ isResendingVerificationOtp: false });
    }
  },

  requestPasswordReset: async (email) => {
    set({ isRequestingPasswordReset: true });
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset link");
      return false;
    } finally {
      set({ isRequestingPasswordReset: false });
    }
  },

  resetPassword: async ({ token, password }) => {
    set({ isResettingPassword: true });
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    if (get().socket && !get().socket.connected) {
      get().socket.connect();
      return;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
      auth: {},
    });

    socket.on("connect", () => {
      set({ socketConnectionStatus: "connected" });
    });

    socket.on("disconnect", () => {
      set({ socketConnectionStatus: "disconnected" });
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
      set({ socketConnectionStatus: "error" });
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.connect();

    set({ socket });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (!socket) return;

    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("getOnlineUsers");
    socket.disconnect();
    set({ socket: null, onlineUsers: [], socketConnectionStatus: "disconnected" });
  },
}));
