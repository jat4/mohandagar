import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Send, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendResetEmail } = useAuth();

  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!inputVal.trim()) {
        throw new Error("Please enter your email or username.");
      }
      await sendResetEmail(inputVal.trim());
      // Requirement 21: Always show a generic success message
      setSuccess("If an account exists, a password reset email has been sent.");
    } catch (err: any) {
      // Even if there is an error, we should verify if it's a security-revealing one or a network failure.
      // If it's a network failure or empty input, we display it. Otherwise we display success to keep it safe.
      const errMsg = err.message || "An error occurred.";
      if (
        errMsg.toLowerCase().includes("network") ||
        errMsg.toLowerCase().includes("offline") ||
        errMsg.toLowerCase().includes("please enter")
      ) {
        setError(errMsg);
      } else {
        setSuccess("If an account exists, a password reset email has been sent.");
      }
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
            Forgot Password
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Recover your account coordinates
          </p>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-950/40 border border-green-800/60 rounded-2xl flex items-start gap-3 text-green-200 text-sm font-semibold text-center"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400 mt-0.5" />
            <div className="flex-1 text-left">
              <span>{success}</span>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-extrabold rounded-lg text-xs transition-colors"
                >
                  Return to Log In
                </Link>
              </div>
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
            </div>
          </motion.div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Username or Email Address
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter username or email address"
                className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm text-white placeholder:text-gray-600"
                required
              />
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
                  <Send className="h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
