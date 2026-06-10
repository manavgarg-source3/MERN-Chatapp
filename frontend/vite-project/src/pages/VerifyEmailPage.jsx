import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    pendingVerificationEmail,
    verifyEmailOtp,
    resendVerificationOtp,
    isVerifyingEmail,
    isResendingVerificationOtp,
  } = useAuthStore();
  const [email, setEmail] = useState(location.state?.email || pendingVerificationEmail || "");
  const [otp, setOtp] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Email is required");
    if (!otp.trim()) return toast.error("OTP is required");
    if (!/^\d{6}$/.test(otp.trim())) return toast.error("OTP must be 6 digits");

    const success = await verifyEmailOtp({ email: email.trim(), otp: otp.trim() });
    if (success) navigate("/login");
  };

  const handleResend = async () => {
    if (!email.trim()) return toast.error("Enter your email first");
    await resendVerificationOtp(email.trim());
  };

  return (
    <div className="app-aurora grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="glass edge-light w-full max-w-md space-y-7 rounded-3xl p-7 shadow-soft sm:p-9">
          <div className="mb-2 text-center">
            <div className="group flex flex-col items-center gap-2">
              <div className="brand-gradient flex size-12 items-center justify-center rounded-2xl shadow-glow-sm transition-transform group-hover:scale-105">
                <MessageSquare className="size-6 text-white" />
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tightish">Verify your email</h1>
              <p className="text-base-content/55">
                Enter the 6-digit OTP sent to your email before logging in.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
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

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">OTP</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input input-bordered w-full pl-10 tracking-[0.4em]"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingEmail}>
              {isVerifyingEmail ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </button>
          </form>

          <div className="space-y-3 text-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResend}
              disabled={isResendingVerificationOtp}
            >
              {isResendingVerificationOtp ? "Sending OTP..." : "Resend OTP"}
            </button>
            <p className="text-base-content/60">
              Already verified?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Secure signup"
        subtitle="We verify every new account with a one-time passcode sent to email."
      />
    </div>
  );
};
