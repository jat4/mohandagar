import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, AlertCircle, Sparkles, CheckCircle2, Send } from "lucide-react";
import { checkUsernameExists } from "../services/dbService";

export default function SignupPage() {
  const {
    signUp,
    usernameNeeded,
    googleUserTemp,
    completeGoogleSignUp
  } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  // Complete Google setup inputs
  const [googleUsername, setGoogleUsername] = useState("");
  const [googleFullName, setGoogleFullName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ checked: boolean; available: boolean; loading: boolean }>({
    checked: false,
    available: false,
    loading: false
  });

  const validateUsername = (val: string) => {
    // Letters, numbers, underscores, dots, 3-20 characters
    const regex = /^[a-zA-Z0-9_\.]{3,20}$/;
    return regex.test(val);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s/g, "");
    if (usernameNeeded) {
      setGoogleUsername(val);
    } else {
      setUsername(val);
    }
  };

  // Debounced username availability checker
  useEffect(() => {
    const activeUsername = usernameNeeded ? googleUsername : username;

    if (activeUsername.length < 3) {
      setUsernameStatus({ checked: false, available: false, loading: false });
      return;
    }

    let active = true;
    setUsernameStatus({ checked: false, available: false, loading: true });

    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(activeUsername);
        if (active) {
          setUsernameStatus({
            checked: true,
            available: !exists && validateUsername(activeUsername),
            loading: false
          });
        }
      } catch {
        if (active) {
          setUsernameStatus({ checked: false, available: false, loading: false });
        }
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [username, googleUsername, usernameNeeded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (usernameNeeded) {
        if (!validateUsername(googleUsername)) {
          throw new Error("Username must be 3-20 characters and contain only letters, numbers, underscores, or dots.");
        }
        if (!usernameStatus.available) {
          throw new Error("Username is already taken.");
        }
        await completeGoogleSignUp(googleUsername, googleFullName || googleUserTemp?.displayName || "");
        navigate("/");
      } else {
        if (!email || !password || !username || !fullName) {
          throw new Error("All fields are required.");
        }
        if (!validateUsername(username)) {
          throw new Error("Username must be 3-20 characters and contain only letters, numbers, underscores, or dots.");
        }
        if (!usernameStatus.available) {
          throw new Error("Username is already taken.");
        }
        await signUp(email, password, username, fullName, gender);
        setSuccess("A verification email has been sent to your email address. Please verify your email before logging in.");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
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
            {usernameNeeded ? "Complete your profile to get started" : "Create your unique path today"}
          </p>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-950/40 border border-green-800/60 rounded-2xl flex items-start gap-3 text-green-200 text-sm font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400 mt-0.5" />
            <div className="flex-1 text-left">
              <span>{success}</span>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-extrabold rounded-lg text-xs transition-colors"
                >
                  Go to Log In
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
            <AnimatePresence mode="wait">
              {usernameNeeded ? (
                <motion.div
                  key="google-setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Choose Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={googleUsername}
                        onChange={handleUsernameChange}
                        placeholder="username"
                        className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm pr-12 text-white placeholder:text-gray-600"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {usernameStatus.loading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {!usernameStatus.loading && usernameStatus.checked && (
                          <span className={`text-xs font-bold ${usernameStatus.available ? "text-green-400" : "text-red-400"}`}>
                            {usernameStatus.available ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </div>
                    {usernameStatus.checked && !usernameStatus.loading && (
                      <p className={`text-xs mt-1.5 ${usernameStatus.available ? "text-green-400" : "text-red-400"}`}>
                        {usernameStatus.available
                          ? `@${googleUsername} is available!`
                          : `@${googleUsername} is taken, invalid, or too short (3-20 chars).`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={googleFullName}
                      onChange={(e) => setGoogleFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm text-white placeholder:text-gray-600"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="username"
                        className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm pr-12 text-white placeholder:text-gray-600"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {usernameStatus.loading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {!usernameStatus.loading && usernameStatus.checked && (
                          <span className={`text-xs font-bold ${usernameStatus.available ? "text-green-400" : "text-red-400"}`}>
                            {usernameStatus.available ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </div>
                    {usernameStatus.checked && !usernameStatus.loading && (
                      <p className={`text-xs mt-1.5 ${usernameStatus.available ? "text-green-400" : "text-red-400"}`}>
                        {usernameStatus.available
                          ? `@${username} is available!`
                          : `@${username} is taken or invalid.`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3.5 focus:outline-none focus:border-white transition-colors text-sm text-white placeholder:text-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["male", "female", "other"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g as any)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all capitalize cursor-pointer ${
                            gender === g
                              ? "bg-white text-black border-white"
                              : "bg-neutral-900 text-gray-400 border-gray-800 hover:text-white hover:border-gray-750"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || usernameStatus.loading || (!usernameNeeded && !usernameStatus.available) || (usernameNeeded && !usernameStatus.available)}
              className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold rounded-lg py-3.5 mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : usernameNeeded ? (
                <>
                  <Send className="h-4 w-4" />
                  Finish Setup
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
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
            Already have an account? Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
