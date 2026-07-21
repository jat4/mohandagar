import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { LogIn, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { logIn, resendVerificationEmailByEmail } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setShowResend(false);

    try {
      if (!usernameOrEmail.trim() || !password) {
        throw new Error("Please enter both username/email and password.");
      }
      await logIn(usernameOrEmail, password);
      // On success, AuthProvider will set the user and the protected route will redirect
    } catch (err: any) {
      const errMsg = err.message || "An authentication error occurred.";
      setError(errMsg);
      if (
        errMsg.toLowerCase().includes("not verified") ||
        errMsg.toLowerCase().includes("verify your email") ||
        errMsg.toLowerCase().includes("verification")
      ) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await resendVerificationEmailByEmail(usernameOrEmail);
      setSuccess("A new verification email has been sent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-950 border border-gray-900 p-8 rounded-lg shadow-2xl relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="inline-flex items-center justify-center p-3 rounded-lg bg-neutral-900 border border-gray-850 mb-4"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
            DagarChat
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Welcome back, chat explorer!
          </p>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-950/40 border border-green-800/60 rounded-2xl flex items-start gap-3 text-green-200 text-sm"
          >
            <div className="flex-1 text-left">
              <span>{success}</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 text-red-200 text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 text-left">
              <span>{error}</span>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-2 block text-xs font-bold text-white underline hover:text-gray-300 cursor-pointer"
                >
                  Resend Verification Email
                </button>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter username or email"
              className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm text-white placeholder:text-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm text-white placeholder:text-gray-600"
              required
            />
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-gray-450 hover:text-white transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold rounded-lg py-3.5 mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Log In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/signup"
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Don't have an account? Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
