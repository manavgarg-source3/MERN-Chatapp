import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isResettingPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) return toast.error("Password is required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");

    const success = await resetPassword({ token, password });
    if (success) navigate("/login");
  };

  return (
    <div className="app-aurora grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="glass edge-light w-full max-w-md space-y-7 rounded-3xl p-7 shadow-soft sm:p-9">
          <div className="mb-2 text-center">
            <div className="group flex flex-col items-center gap-2">
              <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow-sm transition-transform group-hover:scale-105">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tightish">Set a new password</h1>
              <p className="text-base-content/55">Choose a new password for your account.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isResettingPassword}>
              {isResettingPassword ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="link link-primary">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title={"Secure account recovery"}
        subtitle={"This page is opened from the reset link sent to your email."}
      />
    </div>
  );
};
