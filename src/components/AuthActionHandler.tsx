import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode
} from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";

type HandlerStatus = "verifying" | "input_password" | "success" | "error" | "none";

export default function AuthActionHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = searchParams.get("continueUrl");

  const [status, setStatus] = useState<HandlerStatus>("verifying");
  const [message, setMessage] = useState("Verifying security code...");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("none");
      setMessage("No valid authorization parameters detected.");
      return;
    }

    // Process the code according to mode
    switch (mode) {
      case "verifyEmail":
        checkActionCode(auth, oobCode)
          .then((info) => {
            const email = info.data.email;
            if (!email) {
              throw new Error("No email found associated with this verification code.");
            }
            return { email };
          })
          .then(({ email }) => {
            return applyActionCode(auth, oobCode)
              .then(async () => {
                const lowerEmail = email.toLowerCase();
                let pendingData: any = null;

                // 1. Try local storage fallback
                const localStored = localStorage.getItem(`pending_profile_${lowerEmail}`);
                if (localStored) {
                  try {
                    pendingData = JSON.parse(localStored);
                  } catch (e) {
                    console.error("Failed to parse local pending profile data:", e);
                  }
                }

                // 2. Try Firestore pending_users fallback
                if (!pendingData) {
                  try {
                    const { db } = await import("../firebase");
                    const { doc, getDoc } = await import("firebase/firestore");
                    const pendingDoc = await getDoc(doc(db, "pending_users", lowerEmail));
                    if (pendingDoc.exists()) {
                      pendingData = pendingDoc.data();
                    }
                  } catch (fsErr) {
                    console.error("Failed to read pending profile from Firestore:", fsErr);
                  }
                }

                // 3. Fallback to query params
                if (!pendingData) {
                  const queryUsername = searchParams.get("username") || "user";
                  const queryFullName = searchParams.get("fullName") || "User";
                  const queryGender = searchParams.get("gender") || "male";
                  const queryUid = searchParams.get("uid") || "usr_" + Math.random().toString(36).substr(2, 9);
                  pendingData = {
                    uid: queryUid,
                    username: queryUsername,
                    fullName: queryFullName,
                    email: email,
                    photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(queryUsername),
                    gender: queryGender,
                  };
                }

                if (pendingData) {
                  const { createUserProfile } = await import("../services/dbService");
                  await createUserProfile(pendingData.uid, {
                    uid: pendingData.uid,
                    username: pendingData.username,
                    fullName: pendingData.fullName,
                    email: pendingData.email,
                    photoURL: pendingData.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(pendingData.username),
                    gender: pendingData.gender || "male"
                  });

                  // Clean up pending profile
                  try {
                    const { db } = await import("../firebase");
                    const { doc, deleteDoc } = await import("firebase/firestore");
                    await deleteDoc(doc(db, "pending_users", lowerEmail));
                  } catch (delErr) {
                    console.warn("Could not delete pending user doc:", delErr);
                  }
                  localStorage.removeItem(`pending_profile_${lowerEmail}`);
                }

                setStatus("success");
                setMessage("Your email address has been successfully verified!");
                startCountdown();
              });
          })
          .catch((err) => {
            setStatus("error");
            setMessage(
              err.message ||
                "Failed to verify your email. The action code may be invalid, expired, or already used."
            );
          });
        break;

      case "resetPassword":
        verifyPasswordResetCode(auth, oobCode)
          .then((userEmail) => {
            setEmail(userEmail);
            setStatus("input_password");
          })
          .catch((err) => {
            setStatus("error");
            setMessage(
              err.message ||
                "The password reset link is invalid or has expired."
            );
          });
        break;

      case "recoverEmail":
        checkActionCode(auth, oobCode)
          .then((info) => {
            const restoredEmail = info.data.email;
            setMessage(`Restoring your email address to ${restoredEmail}...`);
            return applyActionCode(auth, oobCode);
          })
          .then(() => {
            setStatus("success");
            setMessage(
              "Your email address has been successfully restored. You can now use your original email to log in."
            );
            startCountdown();
          })
          .catch((err) => {
            setStatus("error");
            setMessage(
              err.message ||
                "Failed to restore email. The action code may be invalid or expired."
            );
          });
        break;

      case "verifyAndChangeEmail":
        applyActionCode(auth, oobCode)
          .then(() => {
            setStatus("success");
            setMessage("Your new email address has been successfully verified and updated!");
            startCountdown();
          })
          .catch((err) => {
            setStatus("error");
            setMessage(
              err.message ||
                "Failed to verify email change. The action code may be invalid or expired."
            );
          });
        break;

      default:
        setStatus("none");
        setMessage("The requested action is not recognized.");
    }
  }, [mode, oobCode]);

  const startCountdown = () => {
    let count = 4;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 1) {
        clearInterval(interval);
        navigate("/login");
      }
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setStatus("success");
      setMessage("Your password has been reset successfully! Redirecting to login...");
      startCountdown();
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden select-none">
      {/* Background gradients or glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neutral-900 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-950 border border-gray-900 p-8 rounded-lg shadow-2xl relative z-10"
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
            Secure Authentication Portal
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center py-6 space-y-4"
            >
              <RefreshCw className="h-10 w-10 text-white animate-spin" />
              <p className="text-sm font-semibold text-gray-300">{message}</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex p-3 bg-neutral-900 border border-gray-850 rounded-full text-green-400 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-white">Action Completed</h2>
              <p className="text-sm text-gray-400 leading-relaxed px-2">
                {message}
              </p>
              <div className="pt-4">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                  Redirecting to login in {countdown}s...
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white hover:bg-neutral-200 text-black font-bold rounded-lg py-3 mt-4 transition-all text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Go to Login Now
              </button>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex p-3 bg-neutral-900 border border-gray-850 rounded-full text-red-500 mb-2">
                <XCircle className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-white">Verification Failed</h2>
              <p className="text-sm text-red-200 leading-relaxed px-2">
                {message}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-neutral-900 hover:bg-neutral-850 border border-gray-800 text-white font-bold rounded-lg py-3 mt-4 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </button>
            </motion.div>
          )}

          {status === "none" && (
            <motion.div
              key="none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex p-3 bg-neutral-900 border border-gray-850 rounded-full text-gray-400 mb-2">
                <XCircle className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-white">Invalid Request</h2>
              <p className="text-sm text-gray-400 leading-relaxed px-2">
                {message}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white hover:bg-neutral-200 text-black font-bold rounded-lg py-3 mt-4 transition-all text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </button>
            </motion.div>
          )}

          {status === "input_password" && (
            <motion.div
              key="input_password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6 text-left">
                <h2 className="text-lg font-bold text-white mb-1">Reset Password</h2>
                <p className="text-xs text-gray-400">
                  Please choose a strong, new password for <span className="text-white font-semibold">{email}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm pr-12 text-white placeholder:text-gray-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm pr-12 text-white placeholder:text-gray-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold rounded-lg py-3.5 mt-2 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg text-sm"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Reset Password
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
