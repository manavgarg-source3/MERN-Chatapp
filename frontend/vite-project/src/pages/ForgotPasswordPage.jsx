import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const { requestPasswordReset, isRequestingPasswordReset } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email format");

    await requestPasswordReset(email);
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
              <h1 className="mt-2 text-2xl font-bold tracking-tightish">Forgot password?</h1>
              <p className="text-base-content/55">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>
          </div>

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
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isRequestingPasswordReset}>
              {isRequestingPasswordReset ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send reset link"
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
        title={"Reset your password"}
        subtitle={"We'll email a secure reset link that opens on your deployed GargX app."}
      />
    </div>
  );
};
