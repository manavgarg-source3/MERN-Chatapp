import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = validateForm();

    if (success === true) {
      const result = await login(formData);
      if (result?.requiresVerification) {
        navigate("/verify-email", { state: { email: result.email || formData.email } });
      }
    }
  };

  return (
    <div className="app-aurora grid min-h-screen lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="glass edge-light w-full max-w-md space-y-8 rounded-3xl p-7 shadow-soft sm:p-9">
          {/* Logo */}
          <div className="mb-2 text-center">
            <div className="group flex flex-col items-center gap-2">
              <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow-sm transition-transform group-hover:scale-105">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tightish">
                Welcome to <span className="text-gradient">GargX</span>
              </h1>
              <p className="text-base-content/55">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
                <Link to="/forgot-password" className="label-text-alt link link-primary">
                  Forgot password?
                </Link>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      />
    </div>
  );
};
